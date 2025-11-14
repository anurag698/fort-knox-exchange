
'use client';

import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Withdrawal } from '@/lib/types';

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

  // The useCollection hook now returns withdrawals with pre-analyzed AI fields.
  const { data, isLoading, error } = useCollection<Withdrawal>(withdrawalsQuery);

  return { 
      data, 
      isLoading, 
      error
  };
}

    