
'use client';

import { collection, query } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Balance } from '@/lib/types';

export function useBalances() {
  const firestore = useFirestore();
  const { user } = useUser();

  const balancesCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'balances') : null),
    [firestore, user]
  );

  const balancesQuery = useMemoFirebase(
    () => (balancesCollectionRef ? query(balancesCollectionRef) : null),
    [balancesCollectionRef]
  );

  return useCollection<Balance>(balancesQuery);
}
