
'use client';

import { collectionGroup, getCountFromServer, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';

export function useWithdrawalsCount(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' = 'PENDING') {
  const firestore = useFirestore();
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const withdrawalsCollection = useMemoFirebase(
    () => (firestore ? collectionGroup(firestore, 'withdrawals') : null),
    [firestore]
  );

  useEffect(() => {
    if (!withdrawalsCollection) {
      setIsLoading(false);
      return;
    }

    const fetchCount = async () => {
      try {
        setIsLoading(true);
        const q = query(withdrawalsCollection, where('status', '==', status));
        const snapshot = await getCountFromServer(q);
        setCount(snapshot.data().count);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch withdrawals count'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [withdrawalsCollection, status]);

  return { count, isLoading, error };
}
