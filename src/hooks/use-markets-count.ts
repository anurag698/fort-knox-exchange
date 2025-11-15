
'use client';

import { collection, getCountFromServer } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';

export function useMarketsCount() {
  const firestore = useFirestore();
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const marketsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'markets') : null),
    [firestore]
  );

  useEffect(() => {
    if (!marketsCollection) {
      setIsLoading(false);
      return;
    }

    const fetchCount = async () => {
      try {
        setIsLoading(true);
        const snapshot = await getCountFromServer(marketsCollection);
        setCount(snapshot.data().count);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch markets count'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [marketsCollection]);


  return { count, isLoading, error };
}

    