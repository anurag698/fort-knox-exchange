
'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Deposit } from '@/lib/types';

/**
 * Fetches all deposit documents for a specific user ID from the 'deposits' collection.
 * @param userId The unique ID of the user whose deposits to fetch.
 */
export function useUserDeposits() {
  const firestore = useFirestore();
  const { user } = useUser();
  const userId = user?.uid;

  const depositsQuery = useMemoFirebase(
    () => {
      if (!firestore || !userId) return null;
      return query(
        collection(firestore, 'users', userId, 'deposits'),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, userId]
  );

  return useCollection<Deposit>(depositsQuery);
}
