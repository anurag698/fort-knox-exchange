
'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId: string) {
  const firestore = useFirestore();
  const { user } = useUser();
  const userId = user?.uid;

  const ordersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'orders') : null),
    [firestore]
  );

  const ordersQuery = useMemoFirebase(
    () => {
      if (!ordersCollection || !userId || !marketId) return null;
      // Query for orders that belong to the current user and are not in a final state
      return query(
        ordersCollection,
        where('userId', '==', userId),
        where('marketId', '==', marketId),
        where('status', 'in', ['OPEN', 'PARTIAL']),
        orderBy('createdAt', 'desc')
      );
    },
    [ordersCollection, userId, marketId]
  );

  return useCollection<Order>(ordersQuery);
}
