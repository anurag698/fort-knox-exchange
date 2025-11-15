
'use client';

import { collectionGroup, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Withdrawal } from '@/lib/types';
import { useEffect, useState } from 'react';

export function useWithdrawals(status: Withdrawal['status'] = 'PENDING') {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      setIsLoadingAdmin(true);
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
  
  const withdrawalsCollectionGroup = useMemoFirebase(
    () => (firestore && isAdmin ? collectionGroup(firestore, 'withdrawals') : null),
    [firestore, isAdmin]
  );

  const withdrawalsQuery = useMemoFirebase(
    () => {
      if (!withdrawalsCollectionGroup) return null;
      return query(
        withdrawalsCollectionGroup,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    },
    [withdrawalsCollectionGroup, status]
  );

  const { data, isLoading, error } = useCollection<Withdrawal>(withdrawalsQuery);
  
  const finalIsLoading = isLoading || isLoadingAdmin;

  return { 
      data: !finalIsLoading && isAdmin ? data : [], 
      isLoading: finalIsLoading, 
      error: !finalIsLoading && !isAdmin ? new Error("You do not have permission to view withdrawals.") : error
  };
}

    
