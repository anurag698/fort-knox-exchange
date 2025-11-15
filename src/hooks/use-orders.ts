
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    // Do not create a query until user loading is complete and a user is present.
    // This prevents a race condition where an unauthenticated query is sent.
    if (isUserLoading || !user) {
      return null;
    }

    const constraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    ];

    if (marketId) {
      constraints.unshift(where('marketId', '==', marketId));
    }

    return query(collection(firestore, 'orders'), ...constraints);
  }, [firestore, user, marketId, isUserLoading]); // Add isUserLoading to the dependency array

  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  // The overall loading state depends on both the initial user loading and the subsequent collection loading.
  return { data, isLoading: isUserLoading || isLoading, error };
}
