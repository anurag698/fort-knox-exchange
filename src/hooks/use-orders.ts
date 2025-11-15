
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(userId?: string, marketId?: string) {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    // If there is no user ID, we cannot fetch orders.
    if (!userId) {
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
