
'use client';

import { collection, query } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Market } from '@/lib/types';

export function useMarkets() {
  const firestore = useFirestore();
  const marketsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'markets') : null),
    [firestore]
  );
  const marketsQuery = useMemoFirebase(
    () => (marketsCollection ? query(marketsCollection) : null),
    [marketsCollection]
  );

  return useCollection<Market>(marketsQuery);
}
