
'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'orders') : null),
    [firestore, user]
  );

  const ordersQuery = useMemoFirebase(() => {
    if (!ordersCollectionRef) return null;
    if (marketId) {
      return query(
        ordersCollectionRef,
        where('marketId', '==', marketId),
        orderBy('createdAt', 'desc')
      );
    }
    return query(ordersCollectionRef, orderBy('createdAt', 'desc'));
  }, [ordersCollectionRef, marketId]);

  return useCollection<Order>(ordersQuery);
}
