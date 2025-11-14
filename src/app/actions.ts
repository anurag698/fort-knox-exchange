
"use server";

import { moderateWithdrawalRequest, type ModerateWithdrawalRequestInput, type ModerateWithdrawalRequestOutput } from "@/ai/flows/moderate-withdrawal-requests";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { redirect } from 'next/navigation';

const withdrawalSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  withdrawalId: z.string().min(1, "Withdrawal ID is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  asset: z.string().min(1, "Asset is required."),
  withdrawalAddress: z.string().min(1, "Withdrawal address is required."),
  userKYCStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  userAccountCreationDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format. Use YYYY-MM-DD.",
  }),
  userWithdrawalHistory: z.string(),
});

type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  result: ModerateWithdrawalRequestOutput | null;
}

export async function checkWithdrawal(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = withdrawalSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: validatedFields.error.flatten().fieldErrors[Object.keys(validatedFields.error.flatten().fieldErrors)[0]][0],
      result: null,
    };
  }

  try {
    const result = await moderateWithdrawalRequest(validatedFields.data as ModerateWithdrawalRequestInput);
    return {
      status: 'success',
      message: 'Withdrawal request analyzed successfully.',
      result,
    };
  } catch (e) {
    const error = e as Error;
    return {
      status: 'error',
      message: error.message || 'An unexpected error occurred.',
      result: null,
    };
  }
}

// This is a placeholder for server-side SDK initialization
// In a real app, you would initialize Firebase Admin SDK here securely.
async function getFirebaseAdmin() {
    const { initializeApp, getApps, getApp, deleteApp } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }

    const appName = 'firebase-admin-app-for-actions';
    
    let app;
    if (!getApps().some(existingApp => existingApp.name === appName)) {
        app = initializeApp({
            credential: {
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: JSON.parse(serviceAccount).client_email,
                privateKey: JSON.parse(serviceAccount).private_key.replace(/\\n/g, '\n'),
            },
        }, appName);
    } else {
        app = getApp(appName);
    }
    
    return { firestore: getFirestore(app), auth: getAuth(app), app };
}

const cancelOrderSchema = z.object({
  orderId: z.string(),
});

export async function cancelOrder(formData: FormData) {
  const validatedFields = cancelOrderSchema.safeParse({
    orderId: formData.get('orderId'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Invalid order ID.',
    };
  }
  
  const { orderId } = validatedFields.data;

  try {
    const { firestore } = await getFirebaseAdmin();
    // For security, you should verify ownership before deleting.
    // This is simplified for the prototype.
    await firestore.collection('orders').doc(orderId).delete();
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
    // For simplicity, we'll hardcode the market and type for now
});

type CreateOrderFormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
}

// NOTE: This action is a placeholder and lacks proper user authentication checks.
// In a production environment, you MUST verify the user's session and identity.
export async function createOrder(prevState: CreateOrderFormState, formData: FormData): Promise<CreateOrderFormState> {
    const validatedFields = createOrderSchema.safeParse(Object.fromEntries(formData.entries()));
    const userId = formData.get('userId') as string;

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
        const { firestore } = await getFirebaseAdmin();
        
        // In a real app, you'd get marketId from the form.
        const marketId = "BTC-USDT"; 

        const newOrder = {
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

        await firestore.collection('orders').add(newOrder);

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
  userId: z.string(),
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

  const { withdrawalId, userId } = validatedFields.data;

  try {
    const { firestore } = await getFirebaseAdmin();
    // In a real application, you would perform more robust checks,
    // but here we get the doc reference directly. This is insecure
    // if the doc ID is predictable. We are using random IDs.
    const withdrawalRef = firestore.collection('users').doc(userId).collection('withdrawals').doc(withdrawalId);
    
    await withdrawalRef.update({
      status: status,
      updatedAt: FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error(`Failed to set withdrawal status to ${status}:`, error);
    // Re-throw to be caught by the calling function, which will handle the redirect.
    throw new Error(`Could not ${status.toLowerCase()} withdrawal.`);
  }
}

export async function approveWithdrawal(formData: FormData) {
  await updateWithdrawalStatus(formData, 'APPROVED');
  revalidatePath('/admin');
  redirect('/admin');
}

export async function rejectWithdrawal(formData: FormData) {
  await updateWithdrawalStatus(formData, 'REJECTED');
  revalidatePath('/admin');
  redirect('/admin');
}
