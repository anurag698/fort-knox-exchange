
'use client';

import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Withdrawal } from '@/lib/types';
import { useEffect, useState } from 'react';

/**
 * Fetches a single withdrawal document by its ID from the 'withdrawals' collection group.
 * @param withdrawalId The unique ID of the withdrawal to fetch.
 */
export function useWithdrawal(withdrawalId: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<Withdrawal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const withdrawalQuery = useMemoFirebase(
    () => {
      if (!firestore || !withdrawalId) return null;
      // Because collection group queries require an index for `where` clauses on fields other than the document ID,
      // and we don't know the full path, we query by the 'id' field within the document.
      return query(
        collectionGroup(firestore, 'withdrawals'),
        where('id', '==', withdrawalId)
      );
    },
    [firestore, withdrawalId]
  );
  
  useEffect(() => {
    if (!withdrawalQuery) {
        setIsLoading(false);
        return;
    }

    const fetchWithdrawal = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(withdrawalQuery);
            if (!querySnapshot.empty) {
                // There should only be one document with a unique withdrawalId
                const doc = querySnapshot.docs[0];
                setData({ ...(doc.data() as Omit<Withdrawal, 'id'>), id: doc.id });
            } else {
                setData(null);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch withdrawal data.'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchWithdrawal();

  }, [withdrawalQuery]);

  return { data, isLoading, error };
}
