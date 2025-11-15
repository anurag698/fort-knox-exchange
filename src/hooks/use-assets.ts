'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Asset } from '@/lib/types';

export function useAssets() {
  const firestore = useFirestore();
  const { user } = useUser();

  const assetsCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'assets') : null),
    [firestore, user]
  );

  const assetsQuery = useMemoFirebase(
    () => (assetsCollectionRef ? query(assetsCollectionRef, orderBy('name', 'asc')) : null),
    [assetsCollectionRef]
  );

  return useCollection<Asset>(assetsQuery);
}
