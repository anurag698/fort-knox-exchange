
'use client';

import { useMemo } from 'react';
import { collectionGroup, query, where, limit } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Withdrawal } from '@/lib/types';

/**
 * Fetches a single withdrawal document by its ID from the 'withdrawals' collection group.
 * @param withdrawalId The unique ID of the withdrawal to fetch.
 */
export function useWithdrawal(withdrawalId: string) {
  const firestore = useFirestore();

  const withdrawalsCollectionGroup = useMemoFirebase(
    () => (firestore ? collectionGroup(firestore, 'withdrawals') : null),
    [firestore]
  );

  const withdrawalQuery = useMemoFirebase(
    () => {
      if (!withdrawalsCollectionGroup || !withdrawalId) return null;
      // Because collection group queries require an index for `where` clauses,
      // and we don't know the full path to the document, we must query
      // by the ID field that should exist on the document itself.
      // We limit it to 1 because we expect the ID to be unique.
      return query(
        withdrawalsCollectionGroup,
        where('id', '==', withdrawalId),
        limit(1)
      );
    },
    [withdrawalsCollectionGroup, withdrawalId]
  );

  const { data, ...rest } = useCollection<Withdrawal>(withdrawalQuery);

  // useCollection returns an array, but we only want a single document.
  return { data: data?.[0] ?? null, ...rest };
}
