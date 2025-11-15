
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';
import { useMemo } from 'react';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    // CRITICAL: Do not build a query until both firestore and user are available.
    // Also requires marketId to be present for a valid composite query.
    if (!firestore || !user?.uid || !marketId) {
      return null;
    }

    // This is the correct, secure, and indexed query.
    // It requires a composite index on (userId, marketId, createdAt)
    const queryConstraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      where('marketId', '==', marketId),
      orderBy('createdAt', 'desc')
    ];

    return query(collection(firestore, 'orders'), ...queryConstraints);

  }, [firestore, user?.uid, marketId]);

  return useCollection<Order>(ordersQuery);
}
