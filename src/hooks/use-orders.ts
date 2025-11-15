
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    // **CRITICAL FIX**: Do not create a query until user loading is complete and a user is present.
    // This prevents a race condition where an invalid query is created on initial render.
    if (isUserLoading || !user) {
      return null;
    }

    const constraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    ];

    if (marketId) {
      // Using unshift to make sure the marketId filter is applied first, which can be better for indexing.
      constraints.unshift(where('marketId', '==', marketId));
    }

    return query(collection(firestore, 'orders'), ...constraints);
  }, [firestore, user?.uid, marketId, isUserLoading]); // isUserLoading and user.uid are the key dependencies

  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  // The overall loading state depends on both the initial user loading and the subsequent collection loading.
  return { data, isLoading: isUserLoading || isLoading, error };
}
