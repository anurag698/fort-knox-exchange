
'use client';

import { collection, query } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import type { Market } from '@/lib/types';

export function useMarkets() {
  const firestore = useFirestore();
  
  const marketsQuery = firestore ? query(collection(firestore, 'markets')) : null;

  return useCollection<Market>(marketsQuery);
}
