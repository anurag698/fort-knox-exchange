
'use client';

import { collectionGroup, getCountFromServer, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import type { Withdrawal } from '@/lib/types';

export function useWithdrawalsCount(status: Withdrawal['status'] = 'PENDING') {
  const firestore = useFirestore();
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const withdrawalsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(
        collectionGroup(firestore, 'withdrawals'),
        where('status', '==', status)
      );
    },
    [firestore, status]
  );

  useEffect(() => {
    if (!withdrawalsQuery) {
        setIsLoading(false);
        return;
    }

    const fetchCount = async () => {
      try {
        setIsLoading(true);
        const snapshot = await getCountFromServer(withdrawalsQuery);
        setCount(snapshot.data().count);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch withdrawals count'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [withdrawalsQuery]);


  return { count, isLoading, error };
}

    