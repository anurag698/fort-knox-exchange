
'use client';

import { collection, getCountFromServer } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';

export function useUsersCount() {
  const firestore = useFirestore();
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const usersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  useEffect(() => {
    if (!usersCollection) {
      setIsLoading(false);
      return;
    }

    const fetchCount = async () => {
      try {
        setIsLoading(true);
        const snapshot = await getCountFromServer(usersCollection);
        setCount(snapshot.data().count);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user count'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [usersCollection]);


  return { count, isLoading, error };
}

    