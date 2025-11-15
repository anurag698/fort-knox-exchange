
'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { Order } from '@/lib/types';
import { useMemo } from 'react';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersQuery = useMemo(() => {
    if (!firestore || !user) return null;
    
    const ordersCollectionRef = collection(firestore, 'orders');
    const queryConstraints = [where('userId', '==', user.uid)];

    if (marketId) {
      queryConstraints.push(where('marketId', '==', marketId));
    }

    queryConstraints.push(orderBy('createdAt', 'desc'));

    return query(ordersCollectionRef, ...queryConstraints);
  }, [firestore, marketId, user]);

  return useCollection<Order>(ordersQuery);
}
