
'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Market } from '@/lib/types';

export function useMarkets() {
  const firestore = useFirestore();

  const marketsCollectionRef = useMemoFirebase(
    () => {
      return firestore ? collection(firestore, 'markets') : null;
    },
    [firestore]
  );

  const marketsQuery = useMemoFirebase(
    () => (marketsCollectionRef ? query(marketsCollectionRef, orderBy('id', 'asc')) : null),
    [marketsCollectionRef]
  );

  const { data, ...rest } = useCollection<Market>(marketsQuery);
  
  // Add mock data for change and volume, as it's not in the database
  const marketsWithMockData = useMemo(() => {
    if (!data) {
      return null;
    }
    const result = data.map(market => ({
      ...market,
      change: (market.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1,
      volume: Math.random() * 1000000,
    }));
    return result;
  }, [data]);

  return { data: marketsWithMockData, ...rest };
}
