
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import type { Asset } from '@/lib/types';
import { useMemo } from 'react';

export function useAssets() {
  const firestore = useFirestore();

  const assetsQuery = useMemo(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'assets'), orderBy('name', 'asc'));
    },
    [firestore]
  );

  return useCollection<Asset>(assetsQuery);
}
