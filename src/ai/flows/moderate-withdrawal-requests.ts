'use server';

/**
 * @fileOverview This flow uses AI to moderate withdrawal requests, flagging suspicious or non-compliant requests to aid in KYC/AML compliance.
 *
 * - moderateWithdrawalRequest - A function that handles the moderation of withdrawal requests.
 * - ModerateWithdrawalRequestInput - The input type for the moderateWithdrawalRequest function.
 * - ModerateWithdrawalRequestOutput - The return type for the moderateWithdrawalRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateWithdrawalRequestInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting the withdrawal.'),
  withdrawalId: z.string().describe('The ID of the withdrawal request.'),
  amount: z.number().describe('The amount of the withdrawal request.'),
  asset: z.string().describe('The asset being withdrawn.'),
  withdrawalAddress: z
    .string() 
    .describe('The withdrawal address provided by the user.'),
  userKYCStatus: z
    .string() 
    .describe(
      'The KYC status of the user (e.g., PENDING, VERIFIED, REJECTED).' 
    ),
  userAccountCreationDate: z.string().describe('The date the user created their account'),
  userWithdrawalHistory: z
    .string() 
    .describe('Summary of the user\'s past withdrawal history.'),
});

export type ModerateWithdrawalRequestInput = z.infer<
  typeof ModerateWithdrawalRequestInputSchema
>;

const ModerateWithdrawalRequestOutputSchema = z.object({
  isSuspicious: z
    .boolean()
    .describe(
      'Whether the withdrawal request is flagged as suspicious or non-compliant.'
    ),
  reason: z
    .string()
    .describe(
      'The reason why the withdrawal request is flagged as suspicious. If request is not suspicious, this field should be empty.'
    ),
  suggestedAction:
   z.string().optional().describe('Suggested action to be taken by the administrator (e.g., \'Request additional KYC information\', \'Manually verify transaction\').'),
});

export type ModerateWithdrawalRequestOutput = z.infer<
  typeof ModerateWithdrawalRequestOutputSchema
>;

export async function moderateWithdrawalRequest(
  input: ModerateWithdrawalRequestInput
): Promise<ModerateWithdrawalRequestOutput> {
  return moderateWithdrawalRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateWithdrawalRequestPrompt',
  input: {schema: ModerateWithdrawalRequestInputSchema},
  output: {schema: ModerateWithdrawalRequestOutputSchema},
  prompt: `You are an AI-powered tool for assisting administrators of a centralized crypto exchange in flagging suspicious or non-compliant withdrawal requests.

You are provided with the following information about a withdrawal request:

- User ID: {{{userId}}}
- Withdrawal ID: {{{withdrawalId}}}
- Amount: {{{amount}}}
- Asset: {{{asset}}}
- Withdrawal Address: {{{withdrawalAddress}}}
- User KYC Status: {{{userKYCStatus}}}
- User Account Creation Date: {{{userAccountCreationDate}}}
- User Withdrawal History: {{{userWithdrawalHistory}}}

Analyze this information and determine if the withdrawal request is suspicious or non-compliant based on common KYC/AML risks and patterns. Consider factors such as the user's KYC status, the size of the withdrawal, the withdrawal address, and the user's past withdrawal history.

Respond with a JSON object in the following format:
{
  "isSuspicious": true/false,
  "reason": "A brief explanation of why the withdrawal request is flagged as suspicious. If request is not suspicious, this field should be empty.",
  "suggestedAction": "Suggested action to be taken by the administrator (e.g., 'Request additional KYC information', 'Manually verify transaction'). This field is optional."
}
`,
});

const moderateWithdrawalRequestFlow = ai.defineFlow(
  {
    name: 'moderateWithdrawalRequestFlow',
    inputSchema: ModerateWithdrawalRequestInputSchema,
    outputSchema: ModerateWithdrawalRequestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
