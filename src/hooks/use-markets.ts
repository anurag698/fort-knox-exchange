'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Market } from '@/lib/types';

export function useMarkets() {
  const firestore = useFirestore();
  const { user } = useUser();

  const marketsCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'markets') : null),
    [firestore, user]
  );

  const marketsQuery = useMemoFirebase(
    () => (marketsCollectionRef ? query(marketsCollectionRef, orderBy('id', 'asc')) : null),
    [marketsCollectionRef]
  );

  const { data, ...rest } = useCollection<Market>(marketsQuery);
  
  // Add mock data for change and volume, as it's not in the database
  const marketsWithMockData = useMemo(() => {
    if (!data) return null;
    return data.map(market => ({
      ...market,
      change: (market.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1,
      volume: (market.id.charCodeAt(1) % 100) * 100000 + Math.random() * 50000,
    }));
  }, [data]);

  return { data: marketsWithMockData, ...rest };
}
