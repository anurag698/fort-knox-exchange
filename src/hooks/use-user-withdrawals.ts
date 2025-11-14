
'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Withdrawal } from '@/lib/types';

/**
 * Fetches withdrawal documents for a user.
 * If a userId is provided, fetches for that user. Otherwise, fetches for the currently authenticated user.
 * @param userId The optional ID of the user whose withdrawals to fetch.
 */
export function useUserWithdrawals(userId?: string) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  // Use the provided userId, or fall back to the authenticated user's ID
  const targetUserId = userId || authUser?.uid;

  const withdrawalsQuery = useMemoFirebase(
    () => {
      if (!firestore || !targetUserId) return null;
      return query(
        collection(firestore, 'users', targetUserId, 'withdrawals'),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, targetUserId]
  );

  return useCollection<Withdrawal>(withdrawalsQuery);
}
