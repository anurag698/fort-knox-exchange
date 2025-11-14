
'use client';

import { collectionGroup, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Withdrawal } from '@/lib/types';

/**
 * Fetches all withdrawal documents for a specific user ID from the 'withdrawals' collection group.
 * @param userId The unique ID of the user whose withdrawals to fetch.
 */
export function useUserWithdrawals(userId: string | undefined) {
  const firestore = useFirestore();

  const withdrawalsQuery = useMemoFirebase(
    () => {
      if (!firestore || !userId) return null;
      // Query for withdrawals with a specific status
      return query(
        collectionGroup(firestore, 'withdrawals'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, userId]
  );

  return useCollection<Withdrawal>(withdrawalsQuery);
}
