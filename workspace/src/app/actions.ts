
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
      // The market ID is already in the correct format, e.g., "BTC-USDT".
      // We just need to remove the hyphen for the Binance API symbol.
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
        const headersObj = await headers();
        const host = headersObj.get('host') || 'localhost:9002';
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
        const apiUrlBase = `${protocol}://${host}`;

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



const moderateWithdrawalSchema = z.object({
  withdrawalId: z.string(),
});

async function updateWithdrawalStatus(
  formData: FormData,
  status: 'APPROVED' | 'REJECTED'
) {
  const validatedFields = moderateWithdrawalSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    throw new Error('Invalid input for withdrawal moderation.');
  }

  const { withdrawalId } = validatedFields.data;

  try {
    const { firestore, FieldValue } = getFirebaseAdmin();

    const withdrawalsRef = firestore.collectionGroup('withdrawals');
    const q = withdrawalsRef.where('id', '==', withdrawalId).limit(1);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      throw new Error(`Withdrawal with ID ${withdrawalId} not found.`);
    }

    const withdrawalDoc = querySnapshot.docs[0];
    
    await withdrawalDoc.ref.update({
      status: status,
      updatedAt: FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error(`Failed to set withdrawal status to ${status}:`, error);
    // Re-throw to be caught by the calling function, which will handle the redirect.
    throw new Error(`Could not ${status.toLowerCase()} withdrawal.`);
  }
}

export async function approveWithdrawal(prevState: any, formData: FormData) {
  await updateWithdrawalStatus(formData, 'APPROVED');
  revalidatePath('/admin');
  redirect('/admin');
}

export async function rejectWithdrawal(prevState: any, formData: FormData) {
  await updateWithdrawalStatus(formData, 'REJECTED');
  revalidatePath('/admin');
  redirect('/admin');
}

const requestDepositSchema = z.object({
  assetId: z.string(),
  userId: z.string(),
});

export async function requestDeposit(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = requestDepositSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { status: 'error', message: "Invalid asset selected." };
    }
    
    const { assetId, userId } = validatedFields.data;

    if (!userId) {
       return { status: 'error', message: 'You must be logged in to request a deposit.' };
    }

    try {
        const headersObj = await headers();
        const host = headersObj.get('host') || 'localhost:9002';
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
        const apiUrl = `${protocol}://${host}/api/deposit-address`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, assetId }),
        });

        // Defensive parsing: Check if response is ok and is JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error(`Unexpected server response (status: ${response.status}). Not valid JSON.`);
        }
        
        if (!response.ok) {
            throw new Error(data.error || data.detail || `Failed to generate address (status: ${response.status})`);
        }

        revalidatePath('/portfolio');
        
        return {
            status: 'success',
            message: `Address generated successfully.`,
            data: { address: data.address },
        };

    } catch (e) {
        const error = e as Error;
        console.error("Request Deposit Error:", error);
        return {
            status: 'error',
            message: error.message || 'Failed to request deposit.',
        };
    }
}


const requestWithdrawalSchema = z.object({
    assetId: z.string(),
    amount: z.coerce.number().positive("Amount must be positive."),
    withdrawalAddress: z.string().min(10, "Withdrawal address is too short."),
    userId: z.string(),
});

export async function requestWithdrawal(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = requestWithdrawalSchema.safeParse(Object.fromEntries(formData.entries()));
    
    if (!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0] || 'Invalid input.';
        return { status: 'error', message: firstError };
    }
    
    const { assetId, amount, withdrawalAddress, userId } = validatedFields.data;

    if (!userId) {
       return { status: 'error', message: 'You must be logged in to request a withdrawal.' };
    }

    try {
        const { firestore, FieldValue } = getFirebaseAdmin();
        const batch = firestore.batch();

        const assetRef = firestore.collection('assets').doc(assetId);
        const assetSnap = await assetRef.get();
        const asset = assetSnap.data();
        
        if (!asset) {
            return { status: 'error', message: 'Could not retrieve asset data for analysis.' };
        }

        const newWithdrawalRef = firestore.collection('users').doc(userId).collection('withdrawals').doc();
        const newWithdrawal = {
            id: newWithdrawalRef.id,
            userId,
            assetId,
            amount,
            withdrawalAddress,
            status: 'PENDING',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            aiRiskLevel: 'Medium', // Default while processing
            aiReason: 'Analysis in progress...',
        };
        batch.set(newWithdrawalRef, newWithdrawal);

        const ledgerEntryRef = firestore.collection('users').doc(userId).collection('ledgerEntries').doc();
        batch.set(ledgerEntryRef, {
            id: ledgerEntryRef.id,
            userId,
            assetId,
            type: 'WITHDRAWAL',
            amount,
            withdrawalId: newWithdrawalRef.id,
            description: `Withdrawal request for ${amount} ${asset.symbol}`,
            createdAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        revalidatePath('/portfolio');
        revalidatePath('/ledger');

        // Now, asynchronously perform AI analysis and update the doc
        (async () => {
            try {
                const moderationInput: ModerateWithdrawalRequestInput = {
                    userId,
                    withdrawalId: newWithdrawalRef.id,
                    amount,
                    asset: asset.symbol,
                    withdrawalAddress,
                };
                
                const result = await moderateWithdrawalRequest(moderationInput);

                await newWithdrawalRef.update({
                    aiRiskLevel: result.riskLevel,
                    aiReason: result.reason,
                });
            } catch (aiError) {
                console.error("AI Analysis background task failed:", aiError);
                await newWithdrawalRef.update({
                    aiRiskLevel: 'Medium',
                    aiReason: 'AI analysis failed to run.',
                });
            }
        })();

        return {
            status: 'success',
            message: `Withdrawal request submitted successfully. AI analysis is in progress.`,
        };

    } catch (e) {
        const error = e as Error;
        console.error("Request Withdrawal Error:", error);
        return {
            status: 'error',
            message: error.message || 'Failed to request withdrawal.',
        };
    }
}

const kycSchema = z.object({
  userId: z.string(),
});

async function updateUserKycStatus(formData: FormData, status: 'VERIFIED' | 'REJECTED') {
    const validatedFields = kycSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        throw new Error('Invalid user ID for KYC action.');
    }

    const { userId } = validatedFields.data;

    try {
        const { firestore, FieldValue } = getFirebaseAdmin();
        const userRef = firestore.collection('users').doc(userId);

        await userRef.update({
            kycStatus: status,
            updatedAt: FieldValue.serverTimestamp(),
        });

    } catch (error) {
        console.error(`Failed to set KYC status to ${status}:`, error);
        throw new Error(`Could not ${status.toLowerCase()} KYC.`);
    }
}

export async function approveKyc(prevState: any, formData: FormData) {
    const userId = formData.get('userId') as string;
    await updateUserKycStatus(formData, 'VERIFIED');
    revalidatePath(`/admin/users/${userId}`);
    redirect(`/admin/users/${userId}`);
}

export async function rejectKyc(prevState: any, formData: FormData) {
    const userId = formData.get('userId') as string;
    await updateUserKycStatus(formData, 'REJECTED');
    revalidatePath(`/admin/users/${userId}`);
    redirect(`/admin/users/${userId}`);
}
    
export async function submitKyc(prevState: any, formData: FormData): Promise<FormState> {
  const userId = formData.get('userId') as string;

  if (!userId) {
     return { status: 'error', message: 'Authentication required.' };
  }

  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(userId);
    
    await userRef.update({
        kycStatus: 'PENDING',
        updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/settings');
    return {
      status: 'success',
      message: 'Your KYC information has been submitted for review.',
    };
  } catch (error) {
    console.error("KYC Submission Error:", error);
    return {
      status: 'error',
      message: 'Failed to submit KYC information.',
    };
  }
}
    

    

    
