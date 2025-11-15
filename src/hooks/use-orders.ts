
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
    
    queryConstraints.push(orderBy('createdAt', 'desc'));

    return query(collection(firestore, 'orders'), ...queryConstraints);

  }, [firestore, user?.uid, marketId]);

  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  return { data, isLoading, error };
}
