
'use client';

import { collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';

export function useUsers() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user && firestore) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Failed to check admin status", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setIsLoadingAdmin(false);
    };
    checkAdmin();
  }, [user, firestore]);

  const usersCollection = useMemoFirebase(
    () => (firestore && isAdmin ? collection(firestore, 'users') : null),
    [firestore, isAdmin]
  );

  const usersQuery = useMemoFirebase(
    () => (usersCollection ? query(usersCollection, orderBy('createdAt', 'desc')) : null),
    [usersCollection]
  );
  
  const { data, isLoading, error } = useCollection<UserProfile>(usersQuery);

  return {
      data: isAdmin ? data : [],
      isLoading: isLoading || isLoadingAdmin,
      error: isAdmin ? error : (user ? new Error("You do not have permission to view users.") : null)
  }
}
