
'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    const ordersCollectionRef = collection(firestore, 'orders');
    // Start with the base query for the user
    let queryConstraints = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ];

    // If a marketId is provided, add it to the query
    if (marketId) {
      queryConstraints = [
        where('userId', '==', user.uid),
        where('marketId', '==', marketId),
        orderBy('createdAt', 'desc')
      ];
    }
    
    // The where and orderBy on different fields requires a composite index.
    // The Firestore error message in the console will provide a direct link to create it.
    return query(ordersCollectionRef, ...queryConstraints);

  }, [firestore, marketId, user]);

  return useCollection<Order>(ordersQuery);
}
