
'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders() {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'orders') : null),
    [firestore]
  );

  const ordersQuery = useMemoFirebase(
    () => {
      if (!ordersCollection || !user) return null;
      // Query for orders that belong to the current user and are not in a final state
      return query(
        ordersCollection,
        where('userId', '==', user.uid),
        where('status', 'in', ['OPEN', 'PARTIAL']),
        orderBy('createdAt', 'desc')
      );
    },
    [ordersCollection, user]
  );

  return useCollection<Order>(ordersQuery);
}
