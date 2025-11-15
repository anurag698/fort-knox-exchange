
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import type { Market } from '@/lib/types';
import { useMemo } from 'react';

export function useMarkets() {
  const firestore = useFirestore();

  const marketsQuery = useMemo(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'markets'), orderBy('id', 'asc'));
    },
    [firestore]
  );

  return useCollection<Market>(marketsQuery);
}
