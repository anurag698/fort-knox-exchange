
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
    if (!firestore || !user?.uid) {
      return null;
    }

    const queryConstraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ];
    
    // Only filter by marketId if it is provided
    if (marketId) {
        queryConstraints.push(where('marketId', '==', marketId));
    }


    return query(collection(firestore, 'orders'), ...queryConstraints);

  }, [firestore, user?.uid, marketId]);

  return useCollection<Order>(ordersQuery);
}
