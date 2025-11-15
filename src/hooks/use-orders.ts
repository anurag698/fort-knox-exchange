
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
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
    
    // orderBy needs to be the last constraint if it's on a different field than the where clauses
    queryConstraints.push(orderBy('createdAt', 'desc'));

    return query(collection(firestore, 'orders'), ...queryConstraints);

  }, [firestore, user?.uid, marketId]);

  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!marketId) return data;
    // Client-side filter as a fallback
    return data.filter(order => order.marketId === marketId);
  }, [data, marketId]);


  return { data: filteredData, isLoading, error };
}

    