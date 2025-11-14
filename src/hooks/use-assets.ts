
'use client';

import { useMemo } from 'react';
import { collection, query, DocumentData } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

export type Asset = {
    id: string;
    symbol: string;
    name: string;
    createdAt: string;
};

export function useAssets() {
  const firestore = useFirestore();

  const assetsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'assets');
  }, [firestore]);

  const assetsQuery = useMemo(() => {
      if (!assetsCollection) return null;
      return query(assetsCollection);
  }, [assetsCollection]);


  return useCollection<Asset>(assetsQuery as any);
}
