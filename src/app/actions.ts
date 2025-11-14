"use server";

import { moderateWithdrawalRequest, type ModerateWithdrawalRequestInput, type ModerateWithdrawalRequestOutput } from "@/ai/flows/moderate-withdrawal-requests";
import { z } from "zod";

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
