
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { Withdrawal } from '@/lib/types';
import { useMemo } from 'react';

export function useUserWithdrawals(userId?: string) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const targetUserId = userId || authUser?.uid;

  const withdrawalsQuery = useMemo(
    () => {
      if (!firestore || !targetUserId) return null;
      const withdrawalsCollectionRef = collection(firestore, 'users', targetUserId, 'withdrawals');
      return query(withdrawalsCollectionRef, orderBy('createdAt', 'desc'));
    },
    [firestore, targetUserId]
  );

  return useCollection<Withdrawal>(withdrawalsQuery);
}

    
