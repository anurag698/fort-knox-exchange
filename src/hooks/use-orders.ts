
'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'orders') : null),
    [firestore]
  );

  const ordersQuery = useMemoFirebase(() => {
    if (!ordersCollectionRef || !user) return null;
    
    const queryConstraints = [where('userId', '==', user.uid)];

    if (marketId) {
      queryConstraints.push(where('marketId', '==', marketId));
    }

    queryConstraints.push(orderBy('createdAt', 'desc'));

    return query(ordersCollectionRef, ...queryConstraints);
  }, [ordersCollectionRef, marketId, user]);

  return useCollection<Order>(ordersQuery);
}
