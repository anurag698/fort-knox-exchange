
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(userId?: string, marketId?: string) {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    // This is the definitive guard. If userId is not provided (because the parent
    // component is still loading it), this factory function returns null,
    // and useCollection will not execute a query.
    if (!firestore || !userId) {
      return null;
    }

    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (marketId) {
      // Use unshift to ensure the marketId filter comes before the orderBy,
      // which can be more efficient for Firestore.
      constraints.unshift(where('marketId', '==', marketId));
    }

    return query(collection(firestore, 'orders'), ...constraints);
    
  }, [firestore, userId, marketId]); // The hook now correctly depends on userId

  return useCollection<Order>(ordersQuery);
}
