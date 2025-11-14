"use server";

import { moderateWithdrawalRequest, type ModerateWithdrawalRequestInput, type ModerateWithdrawalRequestOutput } from "@/ai/flows/moderate-withdrawal-requests";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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

const cancelOrderSchema = z.object({
  orderId: z.string(),
});

// This is a placeholder for server-side SDK initialization
// In a real app, you would initialize Firebase Admin SDK here securely.
async function getFirestoreAdmin() {
    const { initializeApp, getApps, getApp, deleteApp } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }

    const appName = 'firebase-admin-app-for-actions';
    
    if (!getApps().some(app => app.name === appName)) {
        initializeApp({
            credential: {
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: JSON.parse(serviceAccount).client_email,
                privateKey: JSON.parse(serviceAccount).private_key,
            },
        }, appName);
    }
    
    return getFirestore(getApp(appName));
}


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
    const firestore = await getFirestoreAdmin();
    await firestore.collection('orders').doc(orderId).delete();
    revalidatePath('/trade');
    return {
      status: 'success',
      message: `Order ${orderId} cancelled.`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to cancel order.',
    };
  }
}