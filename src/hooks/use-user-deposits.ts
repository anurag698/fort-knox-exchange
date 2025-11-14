'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Deposit } from '@/lib/types';

/**
 * Fetches deposit documents for a user.
 * If a userId is provided, fetches for that user. Otherwise, fetches for the currently authenticated user.
 * @param userId The optional ID of the user whose deposits to fetch.
 */
export function useUserDeposits(userId?: string) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  
  // Use the provided userId, or fall back to the authenticated user's ID
  const targetUserId = userId || authUser?.uid;

  const depositsQuery = useMemoFirebase(
    () => {
      if (!firestore || !targetUserId) return null;
      return query(
        collection(firestore, 'users', targetUserId, 'deposits'),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, targetUserId]
  );

  return useCollection<Deposit>(depositsQuery);
}
