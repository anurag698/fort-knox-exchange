"use server";

import { moderateWithdrawalRequest, type ModerateWithdrawalRequestInput, type ModerateWithdrawalRequestOutput } from "@/ai/flows/moderate-withdrawal-requests";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { seedInitialData } from "@/lib/seed-data";
import axios from 'axios';
import { headers } from 'next/headers';
import type { DexBuildTxResponse } from '@/lib/dex/dex.types';
import { broadcastAndReconcileTransaction } from "@/lib/wallet-service";

type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: any;
}

export async function seedDatabase(prevState: any, formData: FormData) {
  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    await seedInitialData(firestore, FieldValue);
    return { status: 'success', message: 'Database seeded successfully!' };
  } catch (error: any) {
    return { status: 'error', message: error.message || 'Failed to seed database.' };
  }
}


export async function updateMarketData(prevState: any, formData: FormData) {
  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const marketsSnapshot = await firestore.collection('markets').limit(1).get();
    
    if (marketsSnapshot.empty) {
      console.log('No markets found. Seeding initial database data...');
      await seedInitialData(firestore, FieldValue);
      console.log('Database seeded successfully. Proceeding to update market data...');
    }

    const batch = firestore.batch();
    const marketDataCol = firestore.collection('market_data');

    const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr`);

    const tickers: any[] = response.data;
    const tickerMap = new Map(tickers.map(t => [t.symbol, t]));

    const allMarketsSnapshot = await firestore.collection('markets').get();

    for (const doc of allMarketsSnapshot.docs) {
      const symbol = doc.id.replace('-', '');
      const ticker = tickerMap.get(symbol);

      if (ticker) {
        const marketData = {
          id: doc.id,
          price: parseFloat(ticker.lastPrice),
          priceChangePercent: parseFloat(ticker.priceChangePercent),
          high: parseFloat(ticker.highPrice),
          low: parseFloat(ticker.lowPrice),
          volume: parseFloat(ticker.volume),
          marketCap: 0, 
          lastUpdated: FieldValue.serverTimestamp(),
        };
        const docRef = marketDataCol.doc(doc.id);
        batch.set(docRef, marketData, { merge: true });
      }
    }
    
    await batch.commit();

    revalidatePath('/markets');
    return { status: 'success', message: 'Market data updated successfully!' };

  } catch (error: any) {
    console.error("Market Data Update Error:", error);
    const errorMessage = error.response?.data?.msg || error.message || 'Failed to update market data.';
    return { status: 'error', message: errorMessage };
  }
}


const updateUserProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long."),
  userId: z.string(),
});

export async function updateUserProfile(prevState: any, formData: FormData) {
  const validatedFields = updateUserProfileSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Invalid data.',
    };
  }
  
  const { username, userId } = validatedFields.data;

  if (!userId) {
     return { status: 'error', message: 'Authentication required.' };
  }

  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(userId);
    
    await userRef.update({
        username,
        updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/settings');
    return {
      status: 'success',
      message: `Username updated successfully.`,
    };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return {
      status: 'error',
      message: 'Failed to update profile.',
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
    return { status: 'error', message: 'Invalid data.' };
  }
  
  const { orderId, userId } = validatedFields.data;

  if (!userId) {
     return { status: 'error', message: 'Authentication required.' };
  }

  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const orderRef = firestore.collection('users').doc(userId).collection('orders').doc(orderId);
    
    await firestore.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) throw new Error('Order not found.');
      const orderData = orderDoc.data();
      if (orderData?.userId !== userId) throw new Error('Permission denied.');
      if (orderData?.status !== 'OPEN' && orderData?.status !== 'PARTIAL') throw new Error(`Order cannot be cancelled.`);
      
      transaction.update(orderRef, { status: 'CANCELED', updatedAt: FieldValue.serverTimestamp() });
      
      // Unlock funds
      const assetToUnlock = orderData.side === 'BUY' ? orderData.marketId.split('-')[1] : orderData.marketId.split('-')[0];
      const amountToUnlock = orderData.side === 'BUY' ? (orderData.price || 0) * (orderData.quantity - orderData.filledAmount) : (orderData.quantity - orderData.filledAmount);
      const balanceRef = firestore.collection('users').doc(userId).collection('balances').doc(assetToUnlock);
      transaction.update(balanceRef, {
          available: FieldValue.increment(amountToUnlock),
          locked: FieldValue.increment(-amountToUnlock),
      });
    });

    revalidatePath('/trade');
    return { status: 'success', message: `Order ${orderId} cancelled.` };
  } catch (error: any) {
    return { status: 'error', message: error.message || 'Failed to cancel order.' };
  }
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
        return { status: 'error', message: Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0] || 'Invalid data' };
    }
    
    const { quantity, side, marketId, userId } = validatedFields.data;

    if (!userId) {
       return { status: 'error', message: 'You must be logged in to place an order.' };
    }
    
    const { firestore, FieldValue } = getFirebaseAdmin();
    const [baseAssetId, quoteAssetId] = marketId.split('-');
    const orderRef = firestore.collection('users').doc(userId).collection('orders').doc();

    try {
        const apiUrlBase = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
        const [srcToken, dstToken] = side === 'BUY' ? [quoteAssetId, baseAssetId] : [baseAssetId, quoteAssetId];
        const assetsSnapshot = await firestore.collection('assets').get();
        const assets = assetsSnapshot.docs.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.data() }), {} as Record<string, any>);
        if (!assets[srcToken] || !assets[dstToken]) throw new Error("Could not find token details.");
        
        const decimals = assets[srcToken].decimals || 18;
        const amountInWei = (quantity * (10 ** decimals)).toString();

        await firestore.runTransaction(async (t) => {
            const balRef = firestore.collection('users').doc(userId).collection('balances').doc(srcToken);
            const balSnap = await t.get(balRef);
            if (!balSnap.exists || balSnap.data()!.available < quantity) throw new Error("Insufficient funds.");
            t.update(balRef, { available: FieldValue.increment(-quantity), locked: FieldValue.increment(quantity) });
            t.set(orderRef, { id: orderRef.id, userId, marketId, side, type: 'MARKET', quantity, status: 'EXECUTING', filledAmount: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        });

        const hotWalletAddress = "0xc4248A802613B40B515B35C15809774635607311"; // Placeholder
        const buildTxBody = { chainId: 137, src: assets[srcToken].contractAddress, dst: assets[dstToken].contractAddress, amount: amountInWei, from: hotWalletAddress, slippage: 1 };
        const buildTxResponse = await fetch(`${apiUrlBase}/api/dex/build-tx`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildTxBody) });
        if (!buildTxResponse.ok) throw new Error('Failed to build transaction.');
        const txData: DexBuildTxResponse = await buildTxResponse.json();

        const dexTxRef = firestore.collection('dex_transactions').doc();
        await dexTxRef.set({ id: dexTxRef.id, orderId: orderRef.id, chainId: 137, oneinchPayload: txData, status: 'BUILT', createdAt: FieldValue.serverTimestamp() });

        const txHash = await broadcastAndReconcileTransaction(dexTxRef.id);
        
        revalidatePath('/trade');
        return { status: 'success', message: `Market ${side} order executed. TxHash: ${txHash.slice(0,10)}...` };

    } catch (serverError: any) {
        return { status: 'error', message: serverError.message || 'Failed to place market order.' };
    }
}
