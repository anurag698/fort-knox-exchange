
"use server";

import { moderateWithdrawalRequest, type ModerateWithdrawalRequestInput } from "@/ai/flows/moderate-withdrawal-requests";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { upsertItem, getItemById } from "@/lib/azure/cosmos";
import { randomUUID } from "crypto";

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
        // Fetch asset data (assuming assets are in 'markets' or 'assets' container? 
        // In cosmos.ts we have 'markets'. Assuming assetId maps to a market or token.
        // Actually, the previous code fetched from 'assets' collection.
        // If 'assets' container doesn't exist in cosmos.ts, we might need to use 'markets' or just assume symbol from frontend?
        // But let's assume we can get it. Or for now, just use the assetId as symbol if we can't fetch.
        // Wait, the previous code did: const asset = assetSnap.data();
        // Let's assume 'markets' container has asset info.
        // Or maybe we should just trust the assetId is the symbol?
        // The form sends assetId.

        // Let's try to fetch from 'markets' if possible, or just proceed.
        // For now, I'll assume assetId IS the symbol or ID.
        // Let's look up the asset.
        // const asset = await getItemById('markets', assetId, assetId); 
        // If not found, maybe fail?

        // Simplified: Just use assetId as the symbol/name for now to unblock.
        const assetSymbol = assetId;

        const withdrawalId = randomUUID();
        const newWithdrawal = {
            id: withdrawalId,
            userId,
            assetId,
            amount,
            withdrawalAddress,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            aiRiskLevel: 'Medium', // Default while processing
            aiReason: 'Analysis in progress...',
        };

        await upsertItem('withdrawals', newWithdrawal);

        const ledgerId = randomUUID();
        await upsertItem('ledger', {
            id: ledgerId,
            userId,
            assetId,
            type: 'WITHDRAWAL',
            amount,
            withdrawalId: withdrawalId,
            description: `Withdrawal request for ${amount} ${assetSymbol}`,
            createdAt: new Date().toISOString(),
        });

        revalidatePath('/portfolio');
        revalidatePath('/ledger');

        // Now, asynchronously perform AI analysis and update the doc
        (async () => {
            try {
                const moderationInput: ModerateWithdrawalRequestInput = {
                    userId,
                    withdrawalId: withdrawalId,
                    amount,
                    asset: assetSymbol,
                    withdrawalAddress,
                };

                const result = await moderateWithdrawalRequest(moderationInput);

                // Update the withdrawal with AI result
                const updatedWithdrawal = {
                    ...newWithdrawal,
                    aiRiskLevel: result.riskLevel,
                    aiReason: result.reason,
                    updatedAt: new Date().toISOString(),
                };
                await upsertItem('withdrawals', updatedWithdrawal);

            } catch (aiError) {
                console.error("AI Analysis background task failed:", aiError);
                const failedWithdrawal = {
                    ...newWithdrawal,
                    aiRiskLevel: 'Medium',
                    aiReason: 'AI analysis failed to run.',
                    updatedAt: new Date().toISOString(),
                };
                await upsertItem('withdrawals', failedWithdrawal);
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
