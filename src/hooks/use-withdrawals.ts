
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
      // Query for withdrawals with a specific status
      return query(
        withdrawalsCollectionGroup,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    },
    [withdrawalsCollectionGroup, status]
  );

  return useCollection<Withdrawal>(withdrawalsQuery);
}
