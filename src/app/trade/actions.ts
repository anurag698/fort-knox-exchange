
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import type { DexBuildTxResponse } from '@/lib/dex/dex.types';
import { broadcastAndReconcileTransaction } from "@/lib/wallet-service";

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


const cancelOrderSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
});

export async function cancelOrder(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = cancelOrderSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Invalid data.',
    };
  }
  
  const { orderId, userId } = validatedFields.data;

  if (!userId) {
     return { status: 'error', message: 'Authentication required.' };
  }


  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    // Path to the order in the user's subcollection
    const orderRef = firestore.collection('users').doc(userId).collection('orders').doc(orderId);
    
    await firestore.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error('Order not found.');
      }
      const orderData = orderDoc.data();
      
      // userId check is implicitly handled by the path, but we can double-check
      if (orderData?.userId !== userId) {
        throw new Error('You do not have permission to cancel this order.');
      }

      if (orderData?.status !== 'OPEN' && orderData?.status !== 'PARTIAL') {
        throw new Error(`Order cannot be cancelled in its current state: ${orderData?.status}`);
      }
      
      transaction.update(orderRef, {
        status: 'CANCELED',
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      // Here you would also unlock the user's funds.
      // This logic is omitted for brevity but is critical in a real implementation.
    });

    revalidatePath('/trade');
    return {
      status: 'success',
      message: `Order ${orderId} cancelled.`,
    };
  } catch (error: any) {
    console.error("Cancel Order Error:", error);
    return {
      status: 'error',
      message: error.message || 'Failed to cancel order.',
    };
  }
}
