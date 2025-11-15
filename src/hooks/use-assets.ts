

'use client';

import { collection, query, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Asset } from '@/lib/types';
import { useEffect, useState } from 'react';

export function useAssets() {
  const firestore = useFirestore();
  const [data, setData] = useState<Asset[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) {
      // Firestore is not yet available.
      return;
    }

    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        const assetsQuery = query(collection(firestore, 'assets'));
        const querySnapshot = await getDocs(assetsQuery);
        const assetsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
        setData(assetsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch assets'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [firestore]);

  return { data, isLoading, error };
}
