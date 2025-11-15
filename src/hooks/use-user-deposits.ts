
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Deposit } from '@/lib/types';

export function useUserDeposits(userId?: string) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const targetUserId = userId || authUser?.uid;

  const depositsCollectionRef = useMemoFirebase(
    () => (firestore && targetUserId ? collection(firestore, 'users', targetUserId, 'deposits') : null),
    [firestore, targetUserId]
  );

  const depositsQuery = useMemoFirebase(
    () => (depositsCollectionRef ? query(depositsCollectionRef, orderBy('createdAt', 'desc')) : null),
    [depositsCollectionRef]
  );

  return useCollection<Deposit>(depositsQuery);
}

    