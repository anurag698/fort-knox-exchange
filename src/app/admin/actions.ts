
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { queryAndUpdateFirst, updateItem } from "@/lib/azure/cosmos-updates";
import type { Withdrawal, UserProfile } from "@/lib/types";

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
    const query = 'SELECT * FROM c WHERE c.id = @id';
    const parameters = [{ name: '@id', value: withdrawalId }];

    await queryAndUpdateFirst<Withdrawal>(
      'withdrawals',
      query,
      parameters,
      { status } as Partial<Withdrawal>
    );

  } catch (error) {
    console.error(`Failed to set withdrawal status to ${status}:`, error);
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

async function updateUserKycStatus(formData: FormData, status: 'approved' | 'rejected') {
  const validatedFields = kycSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    throw new Error('Invalid user ID for KYC action.');
  }

  const { userId } = validatedFields.data;

  try {
    await updateItem<UserProfile>(
      'users',
      userId,
      userId,
      { kycStatus: status } as Partial<UserProfile>
    );

  } catch (error) {
    console.error(`Failed to set KYC status to ${status}:`, error);
    throw new Error(`Could not ${status} KYC.`);
  }
}

export async function approveKyc(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string;
  await updateUserKycStatus(formData, 'approved');
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}`);
}

export async function rejectKyc(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string;
  await updateUserKycStatus(formData, 'rejected');
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}`);
}
