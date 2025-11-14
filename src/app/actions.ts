
"use server";

import { moderateWithdrawalRequest, type ModerateWithdrawalRequestInput, type ModerateWithdrawalRequestOutput } from "@/ai/flows/moderate-withdrawal-requests";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { cookies } from "next/headers";
import { getFirebaseAdmin, getUserIdFromSession } from "@/lib/firebase-admin";

const cancelOrderSchema = z.object({
  orderId: z.string(),
});

export async function cancelOrder(formData: FormData) {
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
    const { firestore } = getFirebaseAdmin();
    const orderRef = firestore.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists || orderDoc.data()?.userId !== userId) {
        return { status: 'error', message: 'Order not found or you do not have permission to cancel it.' };
    }
    
    await orderRef.update({
        status: 'CANCELED',
        updatedAt: new Date(),
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
});

type CreateOrderFormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
}

export async function createOrder(prevState: CreateOrderFormState, formData: FormData): Promise<CreateOrderFormState> {
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
    
    const { price, quantity, side } = validatedFields.data;

    try {
        const { firestore } = getFirebaseAdmin();
        
        const marketId = "BTC-USDT"; 

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
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await newOrderRef.set(newOrder);

        revalidatePath('/trade');
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
    const { firestore } = getFirebaseAdmin();

    const withdrawalsRef = firestore.collectionGroup('withdrawals');
    const q = withdrawalsRef.where('id', '==', withdrawalId).limit(1);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      throw new Error(`Withdrawal with ID ${withdrawalId} not found.`);
    }

    const withdrawalDoc = querySnapshot.docs[0];
    
    await withdrawalDoc.ref.update({
      status: status,
      updatedAt: new Date(),
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
    const { auth } = getFirebaseAdmin();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(token, { expiresIn });

    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    
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
