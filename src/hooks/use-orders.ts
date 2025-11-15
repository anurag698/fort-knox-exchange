
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    const ordersCollectionRef = collection(firestore, 'orders');
    
    // Start with the base security requirement: always filter by the current user.
    const queryConstraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ];

    // If a marketId is also provided, add it to the filter.
    // This requires a composite index on (userId, marketId, createdAt).
    if (marketId) {
      queryConstraints.unshift(where('marketId', '==', marketId));
    }
    
    // The where and orderBy on different fields requires a composite index.
    // The Firestore error message in the console will provide a direct link to create it if needed.
    return query(ordersCollectionRef, ...queryConstraints);

  }, [firestore, marketId, user]);

  return useCollection<Order>(ordersQuery);
}
