
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: any;
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

