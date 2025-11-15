
'use client';

import { collection, query, where, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';
import { useMemo } from 'react';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) {
      return null;
    }

    const queryConstraints: QueryConstraint[] = [
      where('userId', '==', user.uid)
    ];

    if (marketId) {
      queryConstraints.push(where('marketId', '==', marketId));
    }
    
    return query(collection(firestore, 'orders'), ...queryConstraints);

  }, [firestore, user?.uid, marketId]);

  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  // Sort on the client side to avoid needing a composite index
  const sortedData = useMemo(() => {
    if (!data) return null;
    return [...data].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }, [data]);
  
  return { data: sortedData, isLoading, error };
}
