
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';

export function useUsers() {
  const firestore = useFirestore();

  const usersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  const usersQuery = useMemoFirebase(
    () => (usersCollection ? query(usersCollection, orderBy('createdAt', 'desc')) : null),
    [usersCollection]
  );

  return useCollection<UserProfile>(usersQuery);
}
