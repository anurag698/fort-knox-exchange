
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { useState, useEffect } from 'react';

export function useUsers() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        // Here you would have your logic to check if user is admin.
        // For now, let's assume we check a custom claim or a field in the user's profile.
        // This is a simplified example.
        setIsAdmin((user as any).isAdmin === true);
      }
      setIsLoadingAdmin(false);
    };
    checkAdmin();
  }, [user]);

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  const usersQuery = useMemoFirebase(
    () => (usersCollectionRef ? query(usersCollectionRef, orderBy('createdAt', 'desc')) : null),
    [usersCollectionRef]
  );

  const { data, isLoading, error } = useCollection<UserProfile>(usersQuery);
  
  const finalIsLoading = isLoading || isLoadingAdmin;

  return { 
      data: !finalIsLoading ? data : [], 
      isLoading: finalIsLoading, 
      error: error
  };
}
