
'use client';

import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';

/**
 * Fetches a single user profile document by its ID in real-time.
 * @param userId The unique ID of the user to fetch.
 */
export function useUserById(userId?: string) {
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && userId ? doc(firestore, 'users', userId) : null),
    [firestore, userId]
  );

  // useDoc is already real-time
  return useDoc<UserProfile>(userDocRef);
}
