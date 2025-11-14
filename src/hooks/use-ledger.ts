
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { LedgerEntry } from '@/lib/types';

export function useLedger() {
  const firestore = useFirestore();
  const { user } = useUser();

  const ledgerCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'ledgerEntries') : null),
    [firestore, user]
  );

  const ledgerQuery = useMemoFirebase(
    () => (ledgerCollectionRef ? query(ledgerCollectionRef, orderBy('createdAt', 'desc')) : null),
    [ledgerCollectionRef]
  );

  return useCollection<LedgerEntry>(ledgerQuery);
}
