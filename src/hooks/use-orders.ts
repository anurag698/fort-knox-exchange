
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
    
    // The security rules require that we must filter by userId.
    const queryConstraints: QueryConstraint[] = [
      where('userId', '==', user.uid)
    ];

    // If a marketId is also provided, add it to the filter.
    if (marketId) {
      queryConstraints.push(where('marketId', '==', marketId));
    }
    
    // Add ordering. This will require a composite index in Firestore.
    // The Firestore console will provide a link to create it if it doesn't exist.
    queryConstraints.push(orderBy('createdAt', 'desc'));

    return query(ordersCollectionRef, ...queryConstraints);

  }, [firestore, marketId, user]);

  return useCollection<Order>(ordersQuery);
}
