
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { Deposit } from '@/lib/types';
import { useMemo } from 'react';

export function useUserDeposits(userId?: string) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const targetUserId = userId || authUser?.uid;

  const depositsQuery = useMemo(
    () => {
      if (!firestore || !targetUserId) return null;
      const depositsCollectionRef = collection(firestore, 'users', targetUserId, 'deposits');
      return query(depositsCollectionRef, orderBy('createdAt', 'desc'));
    },
    [firestore, targetUserId]
  );

  return useCollection<Deposit>(depositsQuery);
}

    
