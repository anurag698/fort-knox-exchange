
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { Balance } from '@/lib/types';
import { useMemo } from 'react';

export function useBalances() {
  const firestore = useFirestore();
  const { user } = useUser();

  const balancesQuery = useMemo(
    () => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'users', user.uid, 'balances'), orderBy('assetId'));
    },
    [firestore, user]
  );

  return useCollection<Balance>(balancesQuery);
}
