
'use server';

import { ethers } from "ethers";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { SafeTransactionDataPartial } from "@safe-global/safe-core-sdk-types";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

// ENV
const RPC_URL = process.env.POLYGON_RPC_URL!;
const PRIVATE_KEY = process.env.HOT_WALLET_PRIVATE_KEY!;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS!;

// Provider + Hot Wallet Signer
export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const hotWallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Init SAFE
export const getSafeSdk = async () => {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: hotWallet,
  });

  return await Safe.create({
    ethAdapter,
    safeAddress: SAFE_ADDRESS,
  });
};

// Create a new deposit wallet for a user
export const createDepositWallet = async () => {
  const wallet = ethers.Wallet.createRandom();

  return {
    address: wallet.address,
    privateKey: wallet.privateKey, // store encrypted (NOT raw)
  };
};

export const saveUserWallet = async (userId: string, wallet: any) => {
  const { firestore } = getFirebaseAdmin()!;
  await firestore.collection("users").doc(userId).collection("wallet").doc("eth").set({
    address: wallet.address,
    encryptedKey: wallet.privateKey, // later use encryption/KMS
    createdAt: new Date(),
    chain: "ethereum",
  });
};


// Get ETH balance for any address
export const getEthBalance = async (address: string) => {
  const bal = await provider.getBalance(address);
  return Number(ethers.formatEther(bal));
};

// Send ETH using the hot wallet
export const transferEth = async (to: string, amountEth: string) => {
  const tx = await hotWallet.sendTransaction({
    to,
    value: ethers.parseEther(amountEth),
  });

  return await tx.wait();
};

// Send ERC20 tokens
export const transferToken = async (
  tokenAddress: string,
  to: string,
  amount: string
) => {
  const abi = ["function transfer(address to, uint256 value)"];
  const contract = new ethers.Contract(tokenAddress, abi, hotWallet);

  const tx = await contract.transfer(to, amount);
  return await tx.wait();
};

// Sweep all ETH from user wallet → SAFE (minus gas fee)
export const sweepWalletToSafe = async (privateKey: string) => {
  const userWallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(userWallet.address);

  if (balance <= 0n) return { status: "empty" };

  const gasPrice = (await provider.getFeeData()).gasPrice;
  if(!gasPrice) {
    throw new Error("Could not fetch gas price for sweep");
  }
  const gasLimit = 21000n;
  const fee = gasPrice * gasLimit;

  if (balance <= fee) {
    return { status: "insufficient_for_gas" };
  }

  const sendAmount = balance - fee;

  const tx = await userWallet.sendTransaction({
    to: SAFE_ADDRESS,
    value: sendAmount,
  });

  return await tx.wait();
};

// Execute Safe transaction (ETH transfer)
export const safeSendEth = async (to: string, amountEth: string) => {
  const safeSdk = await getSafeSdk();

  const safeTxData: SafeTransactionDataPartial = {
    to,
    data: "0x",
    value: ethers.parseEther(amountEth).toString(),
  };

  const safeTx = await safeSdk.createTransaction({ transactions: [safeTxData] });
  const result = await safeSdk.executeTransaction(safeTx);

  return result;
};

// Execute Safe ERC20 transfer
export const safeSendToken = async (
  tokenAddress: string,
  to: string,
  amountWei: string
) => {
  const safeSdk = await getSafeSdk();

  const abiInterface = new ethers.Interface([
    "function transfer(address to, uint256 value) public returns (bool)",
  ]);

  const data = abiInterface.encodeFunctionData("transfer", [to, amountWei]);

  const txData: SafeTransactionDataPartial = {
    to: tokenAddress,
    value: "0",
    data,
  };

  const safeTx = await safeSdk.createTransaction({ transactions: [txData] });
  return await safeSdk.executeTransaction(safeTx);
};

// Fix SAFE stuck nonce
export const getSafeNonce = async () => {
  const safeSdk = await getSafeSdk();
  return await safeSdk.getNonce();
};


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


export async function broadcastAndReconcileTransaction(dexTxId: string): Promise<string> {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("HOT_WALLET_PRIVATE_KEY is not set on the server.");
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
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
