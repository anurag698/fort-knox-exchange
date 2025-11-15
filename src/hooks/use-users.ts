
'use client';

import { collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';

export function useUsers() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    // Only run the check if the user object is available.
    if (user && firestore) {
      setIsCheckingAdmin(true);
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef)
        .then(userDoc => {
          if (userDoc.exists() && userDoc.data().isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        })
        .catch(error => {
          console.error("Failed to check admin status", error);
          setIsAdmin(false);
        })
        .finally(() => {
          setIsCheckingAdmin(false);
        });
    } else if (!isUserLoading) {
      // If there's no user and we're not loading one, they're not an admin.
      setIsAdmin(false);
      setIsCheckingAdmin(false);
    }
  }, [user, firestore, isUserLoading]);

  const usersCollection = useMemoFirebase(
    () => (firestore && isAdmin ? collection(firestore, 'users') : null),
    [firestore, isAdmin]
  );

  const usersQuery = useMemoFirebase(
    () => (usersCollection ? query(usersCollection, orderBy('createdAt', 'desc')) : null),
    [usersCollection]
  );
  
  // Fetch data only if the user is an admin.
  const { data, isLoading, error } = useCollection<UserProfile>(usersQuery);

  const showLoading = isLoading || isCheckingAdmin;
  
  // If we're done checking and the user is not an admin, return empty with an error.
  if (!showLoading && !isAdmin) {
      return {
          data: [],
          isLoading: false,
          error: new Error("You do not have permission to view users.")
      }
  }

  // Otherwise, return the result of the collection query.
  return {
      data,
      isLoading: showLoading,
      error
  }
}
