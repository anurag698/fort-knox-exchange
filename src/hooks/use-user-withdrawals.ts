
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Withdrawal } from '@/lib/types';

export function useUserWithdrawals(userId?: string) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const targetUserId = userId || authUser?.uid;

  const withdrawalsCollectionRef = useMemoFirebase(
    () => (firestore && targetUserId ? collection(firestore, 'users', targetUserId, 'withdrawals') : null),
    [firestore, targetUserId]
  );

  const withdrawalsQuery = useMemoFirebase(
    () => (withdrawalsCollectionRef ? query(withdrawalsCollectionRef, orderBy('createdAt', 'desc')) : null),
    [withdrawalsCollectionRef]
  );

  return useCollection<Withdrawal>(withdrawalsQuery);
}

    
