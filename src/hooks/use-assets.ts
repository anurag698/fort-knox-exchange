
'use client';

import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Asset } from '@/lib/types';

export function useAssets() {
  const firestore = useFirestore();
  const assetsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'assets') : null),
    [firestore]
  );
  const assetsQuery = useMemo(
    () => (assetsCollection ? query(assetsCollection) : null),
    [assetsCollection]
  );

  return useCollection<Asset>(assetsQuery);
}
