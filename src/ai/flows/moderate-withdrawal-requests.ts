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
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Balance, Deposit, UserProfile, Withdrawal } from '@/lib/types';


// Define the input schema for the user data fetching tool
const UserDataToolInputSchema = z.object({
  userId: z.string().describe('The ID of the user to fetch data for.'),
});

// Define the output schema for the user data fetching tool
const UserDataToolOutputSchema = z.object({
  userProfile: z.custom<UserProfile>(),
  balances: z.array(z.custom<Balance>()),
  deposits: z.array(z.custom<Deposit>()),
  withdrawals: z.array(z.custom<Withdrawal>()),
});

// Define the Genkit Tool
const getUserData = ai.defineTool(
  {
    name: 'getUserData',
    description: 'Retrieves comprehensive data for a given user ID from Firestore.',
    inputSchema: UserDataToolInputSchema,
    outputSchema: UserDataToolOutputSchema,
  },
  async ({userId}) => {
    const { firestore } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(userId);
    
    // Fetch all data in parallel
    const [userSnap, balancesSnap, depositsSnap, withdrawalsSnap] = await Promise.all([
        userRef.get(),
        userRef.collection('balances').get(),
        userRef.collection('deposits').orderBy('createdAt', 'desc').limit(20).get(),
        userRef.collection('withdrawals').orderBy('createdAt', 'desc').limit(20).get(),
    ]);

    if (!userSnap.exists) {
        throw new Error(`User with ID ${userId} not found.`);
    }

    // Process snapshots into typed arrays
    const toData = <T>(snap: FirebaseFirestore.QuerySnapshot) => snap.docs.map(doc => ({...doc.data(), id: doc.id} as T));

    return {
        userProfile: {...userSnap.data(), id: userSnap.id} as UserProfile,
        balances: toData<Balance>(balancesSnap),
        deposits: toData<Deposit>(depositsSnap),
        withdrawals: toData<Withdrawal>(withdrawalsSnap),
    };
  }
);


const ModerateWithdrawalRequestInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting the withdrawal.'),
  withdrawalId: z.string().describe('The ID of the withdrawal request.'),
  amount: z.number().describe('The amount of the withdrawal request.'),
  asset: z.string().describe('The asset being withdrawn.'),
  withdrawalAddress: z.string().describe('The withdrawal address provided by the user.'),
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
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']).describe('The calculated risk level of the request.'),
  reason: z
    .string()
    .describe(
      'The reason why the withdrawal request is flagged as suspicious. If request is not suspicious, this should explain why the risk is low.'
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
  tools: [getUserData],
  prompt: `You are an AI-powered tool for assisting administrators of a centralized crypto exchange in flagging suspicious or non-compliant withdrawal requests. Your primary goal is to assess risk and provide a clear, actionable analysis.

You are provided with the initial withdrawal request details:
- Withdrawal ID: {{{withdrawalId}}}
- Amount: {{{amount}}} {{{asset}}}
- Withdrawal Address: {{{withdrawalAddress}}}

Your first step is to ALWAYS use the getUserData tool to fetch the complete and most up-to-date information for the user with ID {{{userId}}}.

Once you have the user's data, perform a comprehensive risk analysis. Consider the following, and other potential risk factors:
- Is the user's KYC status 'VERIFIED'? Unverified users are a high risk.
- Is this withdrawal amount significantly large relative to their total balance?
- Is the user's account very new? (Compare createdAt to today's date). Withdrawals from new accounts are higher risk.
- Does the user have a history of successful withdrawals, or have they had many rejected requests? A lack of history or a pattern of rejections is a risk factor.
- Is the withdrawal address a known high-risk address? (For this simulation, you can imagine you have a list of such addresses).
- Does the withdrawal amount represent a very high percentage of their total portfolio value?

Based on your analysis, determine a risk level and set the 'isSuspicious' flag accordingly.
- Low: Not suspicious. Standard user activity.
- Medium: Potentially suspicious, warrants a second look.
- High: Very likely suspicious, strong indicators of unusual activity.
- Critical: Almost certainly fraudulent or non-compliant.

'isSuspicious' should be true if the risk level is Medium, High, or Critical.

Respond with a JSON object in the specified format. The 'reason' field must always be populated, explaining either why the request is suspicious or why it is considered low risk. Base your reasoning on the data you fetched with the tool.
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
