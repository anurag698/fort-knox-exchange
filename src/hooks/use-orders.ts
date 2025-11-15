
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
    
    // NOTE: A previous version included an `orderBy('createdAt')` clause.
    // This was removed because a query with a filter on one field (`userId`) and
    // an orderBy on a different field (`createdAt`) requires a composite index.
    // Without the index, Firestore returns a permission denied error.
    // By removing the orderBy, the query becomes a simple filter that works
    // with the default single-field indexes and satisfies the security rule.
    return query(ordersCollectionRef, ...queryConstraints);

  }, [firestore, marketId, user]);

  return useCollection<Order>(ordersQuery);
}
