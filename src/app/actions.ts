
"use server";

import { moderateWithdrawalRequest, type ModerateWithdrawalRequestInput, type ModerateWithdrawalRequestOutput } from "@/ai/flows/moderate-withdrawal-requests";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { cookies } from "next/headers";
import { getFirebaseAdmin, getUserIdFromSession } from "@/lib/firebase-admin";
import { seedInitialData } from "@/lib/seed-data";
import axios from 'axios';

type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
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
    const marketsSnapshot = await firestore.collection('markets').get();
    if (marketsSnapshot.empty) {
      return { status: 'error', message: 'No markets found. Please seed the database first.' };
    }

    const batch = firestore.batch();
    const marketDataCol = firestore.collection('market_data');

    const apiKey = process.env.BINANCE_API_KEY;
    if (!apiKey) {
      // This is a server-side action, so a missing key is a critical configuration error.
      // We should not proceed with a default key here.
      console.error('Binance API key is not configured on the server.');
      return { status: 'error', message: 'Server is not configured for market data updates.' };
    }

    const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr`, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    const tickers: any[] = response.data;
    const tickerMap = new Map(tickers.map(t => [t.symbol, t]));

    for (const doc of marketsSnapshot.docs) {
      const market = doc.data();
      const symbol = `${market.baseAssetId}${market.quoteAssetId}`;
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
});

export async function updateUserProfile(prevState: any, formData: FormData) {
  const validatedFields = updateUserProfileSchema.safeParse({
    username: formData.get('username'),
  });

  const userId = await getUserIdFromSession();
  if (!userId) {
     return { status: 'error', message: 'Authentication required.' };
  }

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Invalid username.',
    };
  }
  
  const { username } = validatedFields.data;

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
});

export async function cancelOrder(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = cancelOrderSchema.safeParse({
    orderId: formData.get('orderId'),
  });

  const userId = await getUserIdFromSession();
  if (!userId) {
     return { status: 'error', message: 'Authentication required.' };
  }

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Invalid order ID.',
    };
  }
  
  const { orderId } = validatedFields.data;

  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const orderRef = firestore.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists || orderDoc.data()?.userId !== userId) {
        return { status: 'error', message: 'Order not found or you do not have permission to cancel it.' };
    }
    
    await orderRef.update({
        status: 'CANCELED',
        updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/trade');
    return {
      status: 'success',
      message: `Order ${orderId} cancelled.`,
    };
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return {
      status: 'error',
      message: 'Failed to cancel order.',
    };
  }
}

const createOrderSchema = z.object({
    price: z.coerce.number().positive("Price must be positive."),
    quantity: z.coerce.number().positive("Amount must be positive."),
    side: z.enum(['BUY', 'SELL']),
    marketId: z.string(),
});

export async function createOrder(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = createOrderSchema.safeParse(Object.fromEntries(formData.entries()));
    const userId = await getUserIdFromSession();

    if (!userId) {
       return { status: 'error', message: 'You must be logged in to place an order.' };
    }

    if (!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0][0];
        return {
            status: 'error',
            message: firstError,
        };
    }
    
    const { price, quantity, side, marketId } = validatedFields.data;

    try {
        const { firestore, FieldValue } = getFirebaseAdmin();
        const batch = firestore.batch();
        
        const [baseAssetId, quoteAssetId] = marketId.split('-');

        const newOrderRef = firestore.collection('orders').doc();
        const newOrder = {
            id: newOrderRef.id,
            userId,
            marketId,
            side,
            price,
            quantity,
            type: 'LIMIT', // Hardcoded for simplicity
            status: 'OPEN',
            filledAmount: 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        batch.set(newOrderRef, newOrder);

        const assetId = side === 'BUY' ? quoteAssetId : baseAssetId;
        const amount = side === 'BUY' ? price * quantity : quantity;
        const ledgerEntryRef = firestore.collection('users').doc(userId).collection('ledgerEntries').doc();
        batch.set(ledgerEntryRef, {
            id: ledgerEntryRef.id,
            userId,
            assetId,
            type: `TRADE_${side}`,
            amount: amount,
            orderId: newOrderRef.id,
            description: `${side} order for ${quantity} ${baseAssetId} at ${price} ${quoteAssetId}.`,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        // Simulate a fee
        const feeAmount = (price * quantity) * 0.001; // 0.1% fee
        const feeLedgerEntryRef = firestore.collection('users').doc(userId).collection('ledgerEntries').doc();
        batch.set(feeLedgerEntryRef, {
            id: feeLedgerEntryRef.id,
            userId,
            assetId: quoteAssetId,
            type: 'FEE',
            amount: feeAmount,
            orderId: newOrderRef.id,
            description: `Trading fee for order ${newOrderRef.id}`,
            createdAt: FieldValue.serverTimestamp(),
        });


        await batch.commit();
        
        revalidatePath('/trade');
        revalidatePath('/ledger');
        return {
            status: 'success',
            message: `${side} order placed successfully.`,
        };

    } catch (e) {
        const error = e as Error;
        console.error("Create Order Error:", error);
        return {
            status: 'error',
            message: error.message || 'Failed to place order.',
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

export async function createSession(token: string) {
  if (!token) {
    return { status: 'error', message: 'Token is required for session creation.' };
  }

  try {
    const { auth, firestore, FieldValue } = getFirebaseAdmin();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(token, { expiresIn });

    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    const decodedToken = await auth.verifyIdToken(token);
    const userRef = firestore.collection('users').doc(decodedToken.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Check if markets exist. If not, this is likely the first user. Seed data.
      const marketsSnapshot = await firestore.collection('markets').limit(1).get();
      if (marketsSnapshot.empty) {
        console.log('No markets found. Seeding initial database data...');
        await seedInitialData(firestore, FieldValue);
        console.log('Database seeded successfully.');
      }
      
      // Create user document and seed balances.
      const batch = firestore.batch();
      const newUser = {
        id: decodedToken.uid,
        email: decodedToken.email,
        username: decodedToken.email?.split('@')[0] ?? `user_${Math.random().toString(36).substring(2, 8)}`,
        kycStatus: 'PENDING',
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        isAdmin: decodedToken.email === 'admin@fortknox.exchange'
      };
      batch.set(userRef, newUser);

      // Seed initial balances
      const balancesRef = firestore.collection('users').doc(decodedToken.uid).collection('balances');
      const usdtBalanceRef = balancesRef.doc('USDT');
      batch.set(usdtBalanceRef, {
        id: usdtBalanceRef.id,
        userId: decodedToken.uid,
        assetId: 'USDT',
        available: 100000,
        locked: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const btcBalanceRef = balancesRef.doc('BTC');
      batch.set(btcBalanceRef, {
        id: btcBalanceRef.id,
        userId: decodedToken.uid,
        assetId: 'BTC',
        available: 1,
        locked: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const ethBalanceRef = balancesRef.doc('ETH');
      batch.set(ethBalanceRef, {
        id: ethBalanceRef.id,
        userId: decodedToken.uid,
        assetId: 'ETH',
        available: 10,
        locked: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const dogeBalanceRef = balancesRef.doc('DOGE');
      batch.set(dogeBalanceRef, {
        id: dogeBalanceRef.id,
        userId: decodedToken.uid,
        assetId: 'DOGE',
        available: 50000,
        locked: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const maticBalanceRef = balancesRef.doc('MATIC');
      batch.set(maticBalanceRef, {
        id: maticBalanceRef.id,
        userId: decodedToken.uid,
        assetId: 'MATIC',
        available: 2000,
        locked: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();
    }
    
    return { status: 'success' };
  } catch (error) {
    console.error('Failed to create session:', error);
    return { status: 'error', message: 'Failed to create session.' };
  }
}

export async function clearSession() {
  try {
    cookies().delete('__session');
    return { status: 'success' };
  } catch (error) {
    console.error('Failed to clear session:', error);
    return { status: 'error', message: 'Failed to clear session.' };
  }
}


const requestDepositSchema = z.object({
  assetId: z.string(),
});

export async function requestDeposit(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = requestDepositSchema.safeParse(Object.fromEntries(formData.entries()));
    const userId = await getUserIdFromSession();

    if (!userId) {
       return { status: 'error', message: 'You must be logged in to request a deposit.' };
    }

    if (!validatedFields.success) {
        return { status: 'error', message: "Invalid asset selected." };
    }
    
    const { assetId } = validatedFields.data;

    try {
        const { firestore, FieldValue } = getFirebaseAdmin();
        const batch = firestore.batch();
        const newDepositRef = firestore.collection('users').doc(userId).collection('deposits').doc();

        const newDeposit = {
            id: newDepositRef.id,
            userId,
            assetId,
            amount: 0, // Amount will be updated by a backend process upon actual crypto receipt
            status: 'PENDING',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        batch.set(newDepositRef, newDeposit);

        const ledgerEntryRef = firestore.collection('users').doc(userId).collection('ledgerEntries').doc();
        batch.set(ledgerEntryRef, {
            id: ledgerEntryRef.id,
            userId,
            assetId,
            type: 'DEPOSIT',
            amount: 0,
            depositId: newDepositRef.id,
            description: `Deposit request for ${assetId}`,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        await batch.commit();

        revalidatePath('/portfolio');
        revalidatePath('/ledger');
        return {
            status: 'success',
            message: `Deposit address generated for asset.`,
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
});

export async function requestWithdrawal(prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = requestWithdrawalSchema.safeParse(Object.fromEntries(formData.entries()));
    const userId = await getUserIdFromSession();

    if (!userId) {
       return { status: 'error', message: 'You must be logged in to request a withdrawal.' };
    }

    if (!validatedFields.success) {
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0][0];
        return { status: 'error', message: firstError };
    }
    
    const { assetId, amount, withdrawalAddress } = validatedFields.data;

    try {
        const { firestore, FieldValue } = getFirebaseAdmin();
        const batch = firestore.batch();

        // Fetch user and asset data required for AI analysis
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        const userProfile = userSnap.data();

        const assetRef = firestore.collection('assets').doc(assetId);
        const assetSnap = await assetRef.get();
        const asset = assetSnap.data();
        
        if (!userProfile || !asset) {
            return { status: 'error', message: 'Could not retrieve user or asset data for analysis.' };
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
                // Simplified withdrawal history for the flow
                const historySnapshot = await firestore.collection('users').doc(userId).collection('withdrawals').get();
                const historySummary = `${historySnapshot.size} past withdrawals.`;

                const moderationInput: ModerateWithdrawalRequestInput = {
                    userId,
                    withdrawalId: newWithdrawalRef.id,
                    amount,
                    asset: asset.symbol,
                    withdrawalAddress,
                    userKYCStatus: userProfile.kycStatus,
                    userAccountCreationDate: userProfile.createdAt.toDate().toISOString(),
                    userWithdrawalHistory: historySummary,
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

const updateUserKycSchema = z.object({
  userId: z.string(),
  status: z.enum(['VERIFIED', 'REJECTED']),
});

async function updateUserKycStatus(formData: FormData, status: 'VERIFIED' | 'REJECTED') {
  const validatedFields = updateUserKycSchema.safeParse({
    userId: formData.get('userId'),
    status: status,
  });

  if (!validatedFields.success) {
    throw new Error('Invalid input for KYC update.');
  }

  const { userId } = validatedFields.data;

  try {
    // In a real app, you would also verify that the calling user is an admin here.
    const { firestore, FieldValue } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(userId);
    
    await userRef.update({
        kycStatus: status,
        updatedAt: FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error(`Failed to set KYC status to ${status}:`, error);
    throw new Error(`Could not update KYC status for user ${userId}.`);
  }
}

export async function approveKyc(prevState: any, formData: FormData) {
    await updateUserKycStatus(formData, 'VERIFIED');
    const userId = formData.get('userId');
    revalidatePath(`/admin/users/${userId}`);
    redirect(`/admin/users/${userId}`);
}

export async function rejectKyc(prevState: any, formData: FormData) {
    await updateUserKycStatus(formData, 'REJECTED');
    const userId = formData.get('userId');
    revalidatePath(`/admin/users/${userId}`);
    redirect(`/admin/users/${userId}`);
}

export async function submitKyc(prevState: any, formData: FormData): Promise<FormState> {
  const userId = await getUserIdFromSession();
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
