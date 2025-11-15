
'use client';

import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Withdrawal } from '@/lib/types';

export function useWithdrawals(status: Withdrawal['status'] = 'PENDING') {
  const firestore = useFirestore();

  const withdrawalsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      const withdrawalsCollectionGroup = collectionGroup(firestore, 'withdrawals');
      return query(
        withdrawalsCollectionGroup,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, status]
  );

  const { data, isLoading, error } = useCollection<Withdrawal>(withdrawalsQuery);
  
  return { data, isLoading, error };
}
