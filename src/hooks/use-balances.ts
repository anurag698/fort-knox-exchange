
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Balance } from '@/lib/types';

export function useBalances() {
  const firestore = useFirestore();
  const { user } = useUser();

  const balancesQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'users', user.uid, 'balances'), orderBy('assetId'));
    },
    [firestore, user]
  );

  return useCollection<Balance>(balancesQuery);
}
