
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';


export function useUsers() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
    },
    [firestore]
  );

  const { data, isLoading, error } = useCollection<UserProfile>(usersQuery);
  
  return {
    data,
    isLoading,
    error
  };
}
