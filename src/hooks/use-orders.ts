
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    // This is the critical guard. If the user state is still loading,
    // or if there is no user, we must not build a query. Return null.
    if (isUserLoading || !user) {
      return null;
    }

    // By the time we get here, we are guaranteed to have a user.
    const constraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    ];

    if (marketId) {
      // Add the marketId filter to the beginning of the constraints array
      // for optimal query performance.
      constraints.unshift(where('marketId', '==', marketId));
    }

    return query(collection(firestore, 'orders'), ...constraints);
  }, [firestore, user, isUserLoading, marketId]); // isUserLoading and user are now key dependencies

  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  // The overall loading state is true if the user is loading OR if the collection is loading.
  return { data, isLoading: isUserLoading || isLoading, error };
}
