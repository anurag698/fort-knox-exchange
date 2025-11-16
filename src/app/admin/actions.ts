
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { getFirebaseAdmin } from "@/lib/firebase-admin";

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
