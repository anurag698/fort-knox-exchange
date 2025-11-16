
"use server";

import { moderateWithdrawalRequest, type ModerateWithdrawalRequestInput } from "@/ai/flows/moderate-withdrawal-requests";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  data?: any;
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
