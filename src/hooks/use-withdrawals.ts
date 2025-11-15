
'use client';

import { collectionGroup, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { Withdrawal } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';

export function useWithdrawals(status: Withdrawal['status'] = 'PENDING') {
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
  
  const withdrawalsQuery = useMemo(
    () => {
      if (!firestore || !isAdmin) return null;
      const withdrawalsCollectionGroup = collectionGroup(firestore, 'withdrawals');
      return query(
        withdrawalsCollectionGroup,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, isAdmin, status]
  );

  const { data, isLoading: isLoadingCollection, error: collectionError } = useCollection<Withdrawal>(withdrawalsQuery);
  
  const finalIsLoading = isCheckingAdmin || (isAdmin && isLoadingCollection);
  const finalError = adminCheckError || collectionError || (!isCheckingAdmin && !isAdmin ? new Error("You do not have permission to view withdrawals.") : null);

  return { 
      data: finalIsLoading || finalError ? null : data, 
      isLoading: finalIsLoading, 
      error: finalError
  };
}
