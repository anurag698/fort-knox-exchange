
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Asset } from '@/lib/types';

export function useAssets() {
  const firestore = useFirestore();

  const assetsCollectionRef = useMemoFirebase(
    () => {
      console.log('useAssets: Creating collection reference for "assets"');
      return firestore ? collection(firestore, 'assets') : null;
    },
    [firestore]
  );

  const assetsQuery = useMemoFirebase(
    () => (assetsCollectionRef ? query(assetsCollectionRef, orderBy('name', 'asc')) : null),
    [assetsCollectionRef]
  );
  
  const { data, isLoading, error } = useCollection<Asset>(assetsQuery);
  console.log('useAssets: Data received from useCollection:', data);
  console.log('useAssets: isLoading:', isLoading);
  console.log('useAssets: error:', error);

  return { data, isLoading, error };
}
