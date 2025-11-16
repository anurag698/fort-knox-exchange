
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import type { DexBuildTxResponse } from '@/lib/dex/dex.types';
import { ethers } from 'ethers';

const POLYGON_RPC_URL = process.env.ETH_NETWORK_RPC || 'https://polygon-rpc.com';

async function broadcastAndReconcileTransaction(dexTxId: string): Promise<string> {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("HOT_WALLET_PRIVATE_KEY is not set on the server.");
    }

    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    const txDocRef = firestore.collection('dex_transactions').doc(dexTxId);

    try {
        const txDoc = await txDocRef.get();
        if (!txDoc.exists) throw new Error(`Dex transaction ${dexTxId} not found.`);
        
        const txData = txDoc.data();
        if (!txData || txData.status !== 'BUILT' || !txData.oneinchPayload) {
            throw new Error(`Transaction ${dexTxId} is not in a broadcastable state.`);
        }
        
        const { oneinchPayload: tx, orderId } = txData;
        
        const txResponse = await wallet.sendTransaction({
            to: tx.to,
            data: tx.data,
            value: tx.value,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gas ? BigInt(tx.gas) + BigInt(50000) : undefined,
        });

        await txDocRef.update({
            status: 'BROADCASTED',
            onchainTxHash: txResponse.hash,
        });

        const receipt = await txResponse.wait();
        if (!receipt || receipt.status !== 1) {
            throw new Error(`Transaction ${txResponse.hash} failed on-chain.`);
        }

        await reconcileTrade(orderId, txResponse.hash);
        await txDocRef.update({ status: 'CONFIRMED' });

        return txResponse.hash;

    } catch (error) {
        console.error(`[WalletService] Error for ${dexTxId}:`, error);
        await txDocRef.update({ status: 'FAILED' });
        throw error;
    }
}

async function reconcileTrade(orderId: string, txHash: string) {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const orderQuery = firestore.collectionGroup('orders').where('id', '==', orderId).limit(1);
    const orderSnapshot = await orderQuery.get();

    if (orderSnapshot.empty) throw new Error(`Order ${orderId} not found for reconciliation.`);
    
    const orderDoc = orderSnapshot.docs[0];
    const orderRef = orderDoc.ref;
    
    await firestore.runTransaction(async (t) => {
        const orderSnap = await t.get(orderRef);
        if (!orderSnap.exists) throw new Error(`Order ${orderId} not found.`);
        
        const order = orderSnap.data()!;
        const { userId, quantity, marketId, side } = order;
        const [baseAssetId, quoteAssetId] = marketId.split('-');
        
        const srcAssetId = side === 'BUY' ? quoteAssetId : baseAssetId;
        const dstAssetId = side === 'BUY' ? baseAssetId : quoteAssetId;
        
        // Simplification: In a real app, parse tx receipt for exact amount received.
        const amountSpent = quantity;
        const amountReceived = quantity;

        const srcBalanceRef = firestore.collection('users').doc(userId).collection('balances').doc(srcAssetId);
        const dstBalanceRef = firestore.collection('users').doc(userId).collection('balances').doc(dstAssetId);

        // Finalize source balance: move from locked to spent
        t.update(srcBalanceRef, {
            locked: FieldValue.increment(-amountSpent),
            updatedAt: FieldValue.serverTimestamp(),
        });
        
        // Finalize destination balance: add received amount
        t.set(dstBalanceRef, { available: FieldValue.increment(amountReceived) }, { merge: true });

        // Update order status
        t.update(orderRef, {
            status: 'FILLED',
            filledAmount: quantity,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Create ledger entry
        const ledgerRef = firestore.collection('users').doc(userId).collection('ledgerEntries').doc();
        t.set(ledgerRef, {
            id: ledgerRef.id,
            userId,
            assetId: dstAssetId,
            type: 'TRADE_SETTLEMENT',
            amount: amountReceived,
            orderId: orderId,
            description: `Market ${side} ${baseAssetId} settled.`,
            createdAt: FieldValue.serverTimestamp(),
        });
    });
}


type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: any;
}

const createOrderSchema = z.object({
    price: z.coerce.number().optional(),
    quantity: z.coerce.number().positive("Amount must be positive."),
    side: z.enum(['BUY', 'SELL']),
    marketId: z.string(),
    type: z.enum(['LIMIT', 'MARKET']),
    userId: z.string(),
});

export async function createMarketOrder(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = createOrderSchema.safeParse(Object.fromEntries(formData.entries()));
    
    if (!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0] || 'Invalid data';
        return {
            status: 'error',
            message: firstError,
        };
    }
    
    const { quantity, side, marketId, userId } = validatedFields.data;

    if (!userId) {
       return { status: 'error', message: 'You must be logged in to place an order.' };
    }
    
    const { firestore, FieldValue } = getFirebaseAdmin();
    const [baseAssetId, quoteAssetId] = marketId.split('-');
    
    // Create the new order in the user's subcollection
    const orderRef = firestore.collection('users').doc(userId).collection('orders').doc();

    try {
        const apiUrlBase = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

        const [srcToken, dstToken] = side === 'BUY'
            ? [quoteAssetId, baseAssetId]
            : [baseAssetId, quoteAssetId];
        
        const amountToLock = quantity;
        const assetToLock = srcToken;
        
        const assetsSnapshot = await firestore.collection('assets').get();
        const assets = assetsSnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data();
            return acc;
        }, {} as Record<string, any>);

        if (!assets[srcToken] || !assets[dstToken]) {
            throw new Error("Could not find token details for the market order.");
        }
        
        const assetData = assets[srcToken];
        const decimals = assetData.decimals || 18; // Default to 18 if not specified
        const amountInWei = (quantity * (10 ** decimals)).toString();

        const quoteQuery = new URLSearchParams({
            chainId: '137', // Hardcoded Polygon for now
            fromTokenAddress: assets[srcToken].contractAddress,
            toTokenAddress: assets[dstToken].contractAddress,
            amount: amountInWei,
        }).toString();

        const quoteResponse = await fetch(`${apiUrlBase}/api/dex/quote?${quoteQuery}`);
        if (!quoteResponse.ok) throw new Error('Failed to get quote from 1inch.');
        const quoteData = await quoteResponse.json();

        // Run transaction to lock funds and create order
        await firestore.runTransaction(async (t) => {
            const balRef = firestore.collection('users').doc(userId).collection('balances').doc(assetToLock);
            const balSnap = await t.get(balRef);
            if (!balSnap.exists || balSnap.data()!.available < amountToLock) throw new Error("Insufficient funds.");
            t.update(balRef, { 
                available: FieldValue.increment(-amountToLock), 
                locked: FieldValue.increment(amountToLock) 
            });
            t.set(orderRef, {
                id: orderRef.id,
                userId,
                marketId,
                side,
                type: 'MARKET',
                quantity,
                status: 'EXECUTING',
                filledAmount: 0,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        const hotWalletAddress = "0xc4248A802613B40B515B35C15809774635607311"; // Placeholder
        const buildTxBody = {
            chainId: 137,
            src: assets[srcToken].contractAddress,
            dst: assets[dstToken].contractAddress,
            amount: amountInWei,
            from: hotWalletAddress,
            slippage: 1,
        };

        const buildTxResponse = await fetch(`${apiUrlBase}/api/dex/build-tx`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildTxBody),
        });

        if (!buildTxResponse.ok) throw new Error('Failed to build transaction with 1inch.');
        const txData: DexBuildTxResponse = await buildTxResponse.json();

        // Save the built transaction to Firestore
        const dexTxRef = firestore.collection('dex_transactions').doc();
        await dexTxRef.set({
            id: dexTxRef.id,
            orderId: orderRef.id,
            chainId: 137,
            oneinchPayload: txData,
            status: 'BUILT',
            createdAt: FieldValue.serverTimestamp(),
        });

        // Asynchronously broadcast and reconcile the transaction
        const txHash = await broadcastAndReconcileTransaction(dexTxRef.id);
        
        revalidatePath('/trade');
        return {
            status: 'success',
            message: `Market ${side} order executed and settled. TxHash: ${txHash.slice(0,10)}...`,
        };

    } catch (serverError: any) {
        console.error("Create Market Order Error:", serverError);
        return {
            status: 'error',
            message: serverError.message || 'Failed to place market order.',
        };
    }
}
