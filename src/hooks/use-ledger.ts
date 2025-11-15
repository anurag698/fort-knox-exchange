
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { LedgerEntry } from '@/lib/types';

export function useLedger() {
  const firestore = useFirestore();
  const { user } = useUser();

  const ledgerQuery = useMemoFirebase(
    () => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'users', user.uid, 'ledgerEntries'), orderBy('createdAt', 'desc'));
    },
    [firestore, user]
  );

  return useCollection<LedgerEntry>(ledgerQuery);
}
