
'use client';

import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Withdrawal } from '@/lib/types';
import { moderateWithdrawalRequest, ModerateWithdrawalRequestInput } from '@/ai/flows/moderate-withdrawal-requests';
import { useUserById } from './use-user-by-id';
import { useAssets } from './use-assets';
import { use, useEffect, useState } from 'react';

export function useWithdrawals(status: Withdrawal['status'] = 'PENDING') {
  const firestore = useFirestore();
  
  const withdrawalsCollectionGroup = useMemoFirebase(
    () => (firestore ? collectionGroup(firestore, 'withdrawals') : null),
    [firestore]
  );

  const withdrawalsQuery = useMemoFirebase(
    () => {
      if (!withdrawalsCollectionGroup) return null;
      return query(
        withdrawalsCollectionGroup,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    },
    [withdrawalsCollectionGroup, status]
  );

  const { data: initialData, isLoading, error } = useCollection<Withdrawal>(withdrawalsQuery);
  const [analyzedData, setAnalyzedData] = useState<Withdrawal[] | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    if (!initialData) {
        setAnalyzedData(null);
        return;
    };
    
    const analyze = async () => {
        setAnalysisLoading(true);
        const analyzed = await Promise.all(initialData.map(async (withdrawal) => {
            // In a real app, you would fetch the full user profile and withdrawal history.
            // For now, we'll use placeholder data.
            const moderationInput: ModerateWithdrawalRequestInput = {
                userId: withdrawal.userId,
                withdrawalId: withdrawal.id,
                amount: withdrawal.amount,
                asset: 'Unknown', // This would be fetched from the assets collection
                withdrawalAddress: withdrawal.withdrawalAddress,
                userKYCStatus: 'PENDING', // This would be fetched from the user's profile
                userAccountCreationDate: new Date().toISOString(),
                userWithdrawalHistory: 'No past withdrawals.',
            };

            try {
                const result = await moderateWithdrawalRequest(moderationInput);
                return {
                    ...withdrawal,
                    aiRiskLevel: result.riskLevel,
                    aiReason: result.reason,
                };
            } catch (e) {
                console.error("AI Analysis failed for withdrawal:", withdrawal.id, e);
                return {
                    ...withdrawal,
                    aiRiskLevel: 'Medium',
                    aiReason: 'AI analysis failed to run.',
                };
            }
        }));
        setAnalyzedData(analyzed);
        setAnalysisLoading(false);
    };

    analyze();

  }, [initialData]);


  return { 
      data: analyzedData, 
      isLoading: isLoading || analysisLoading, 
      error
  };
}

    
