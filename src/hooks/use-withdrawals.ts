
'use client';

import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Withdrawal, Asset, UserProfile } from '@/lib/types';
import { moderateWithdrawalRequest } from '@/ai/flows/moderate-withdrawal-requests';
import { useAssets } from './use-assets';
import { useUserWithdrawals } from './use-user-withdrawals';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

type AnalyzedWithdrawal = Withdrawal & { 
    aiRiskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
    aiReason?: string; 
};


export function useWithdrawals(status: Withdrawal['status'] = 'PENDING') {
  const firestore = useFirestore();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const [analyzedWithdrawals, setAnalyzedWithdrawals] = useState<AnalyzedWithdrawal[] | null>(null);

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

  const { data: withdrawals, isLoading: withdrawalsLoading, error } = useCollection<Withdrawal>(withdrawalsQuery);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (withdrawals && assets && withdrawals.length > 0) {
      const analyze = async () => {
        setIsAnalyzing(true);
        const assetsMap = new Map(assets.map(asset => [asset.id, asset]));

        const analyzed = await Promise.all(
          withdrawals.map(async (w) => {
            const userRef = doc(firestore, 'users', w.userId);
            const userSnap = await getDoc(userRef);
            const userProfile = userSnap.data() as UserProfile | undefined;
            const asset = assetsMap.get(w.assetId);

            // Fetch user-specific withdrawal history - this is a simplified approach.
            // For performance, you might want a more optimized way to get this.
            const userHistoryQuery = query(collectionGroup(firestore, 'withdrawals'), where('userId', '==', w.userId));
            const historySnap = await getDocs(userHistoryQuery);
            const historySummary = `${historySnap.size} past withdrawals.`;


            if (!userProfile || !asset) {
              return { 
                ...w,
                aiRiskLevel: 'Medium',
                aiReason: 'Could not fetch complete user or asset information.' 
             };
            }
            
            try {
              const result = await moderateWithdrawalRequest({
                userId: w.userId,
                withdrawalId: w.id,
                amount: w.amount,
                asset: asset.symbol,
                withdrawalAddress: w.withdrawalAddress,
                userKYCStatus: userProfile.kycStatus,
                userAccountCreationDate: userProfile.createdAt.toDate().toISOString(),
                userWithdrawalHistory: historySummary,
              });

              return {
                ...w,
                aiRiskLevel: result.riskLevel,
                aiReason: result.reason,
              };

            } catch (e) {
                console.error("AI analysis failed for withdrawal:", w.id, e);
                return {
                    ...w,
                    aiRiskLevel: 'Medium',
                    aiReason: 'AI analysis failed to run.'
                }
            }
          })
        );
        setAnalyzedWithdrawals(analyzed);
        setIsAnalyzing(false);
      };
      analyze();
    } else if (withdrawals) {
        setAnalyzedWithdrawals(withdrawals);
    }
  }, [withdrawals, assets, firestore]);

  return { 
      data: analyzedWithdrawals, 
      isLoading: withdrawalsLoading || assetsLoading || isAnalyzing, 
      error 
  };
}
