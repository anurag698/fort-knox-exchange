
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Asset } from '@/lib/types';

export function useAssets() {
  const firestore = useFirestore();

  const assetsCollectionRef = useMemoFirebase(
    () => {
      return firestore ? collection(firestore, 'assets') : null;
    },
    [firestore]
  );

  const assetsQuery = useMemoFirebase(
    () => (assetsCollectionRef ? query(assetsCollectionRef, orderBy('name', 'asc')) : null),
    [assetsCollectionRef]
  );
  
  const { data, isLoading, error } = useCollection<Asset>(assetsQuery);

  return { data, isLoading, error };
}
