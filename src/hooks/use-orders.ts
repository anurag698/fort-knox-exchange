'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();
  const userId = user?.uid;

  const ordersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'orders') : null),
    [firestore]
  );

  const ordersQuery = useMemoFirebase(
    () => {
      if (!ordersCollection || !userId) return null;
      
      const constraints = [
        where('userId', '==', userId),
        where('status', 'in', ['OPEN', 'PARTIAL']),
        orderBy('createdAt', 'desc')
      ];

      if (marketId) {
        constraints.splice(1, 0, where('marketId', '==', marketId));
      }

      return query(ordersCollection, ...constraints);
    },
    [ordersCollection, userId, marketId]
  );

  return useCollection<Order>(ordersQuery);
}
