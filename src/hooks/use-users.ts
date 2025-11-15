
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';

export function useUsers() {
  const firestore = useFirestore();

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  const usersQuery = useMemoFirebase(
    () => (usersCollectionRef ? query(usersCollectionRef, orderBy('createdAt', 'desc')) : null),
    [usersCollectionRef]
  );

  return useCollection<UserProfile>(usersQuery);
}
