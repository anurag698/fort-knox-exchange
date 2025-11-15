
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(userId?: string, marketId?: string) {
  const firestore = useFirestore();

  // This is the definitive fix.
  // The query is only constructed inside useMemoFirebase, and the memoization
  // now depends directly on `userId`. If `userId` is undefined or null,
  // the factory function will return `null`, preventing any query from being created.
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !userId) {
      return null;
    }

    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (marketId) {
      constraints.unshift(where('marketId', '==', marketId));
    }

    return query(collection(firestore, 'orders'), ...constraints);
    
  }, [firestore, userId, marketId]);

  return useCollection<Order>(ordersQuery);
}
