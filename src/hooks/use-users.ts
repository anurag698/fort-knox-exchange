
'use client';

import { collection, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';

export function useUsers() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [adminCheckError, setAdminCheckError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || !firestore) {
        setIsCheckingAdmin(false);
        return;
      }
      setIsCheckingAdmin(true);
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        setIsAdmin(userDoc.exists() && userDoc.data().isAdmin === true);
        setAdminCheckError(null);
      } catch (error) {
        console.error("Admin check failed:", error);
        setAdminCheckError(error instanceof Error ? error : new Error("Failed to verify user permissions."));
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };
    checkAdmin();
  }, [user, firestore]);

  const usersQuery = useMemo(
    () => {
      if (!firestore || !isAdmin) return null;
      return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
    },
    [firestore, isAdmin]
  );

  const { data, isLoading: isLoadingCollection, error: collectionError } = useCollection<UserProfile>(usersQuery);
  
  const finalIsLoading = isCheckingAdmin || (isAdmin && isLoadingCollection);
  
  const finalError = adminCheckError || collectionError || (!isCheckingAdmin && !isAdmin ? new Error("You do not have permission to view this page.") : null);

  return { 
      data: finalIsLoading || finalError ? null : data, 
      isLoading: finalIsLoading, 
      error: finalError
  };
}
