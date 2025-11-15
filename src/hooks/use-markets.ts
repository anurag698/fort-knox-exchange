
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Market } from '@/lib/types';

export function useMarkets() {
  const firestore = useFirestore();

  const marketsCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'markets') : null),
    [firestore]
  );

  const marketsQuery = useMemoFirebase(
    () => (marketsCollectionRef ? query(marketsCollectionRef, orderBy('id', 'asc')) : null),
    [marketsCollectionRef]
  );

  return useCollection<Market>(marketsQuery);
}
