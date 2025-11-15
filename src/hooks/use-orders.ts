
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // This hook now depends on `isUserLoading` to prevent running before auth is ready.
  const ordersQuery = useMemoFirebase(() => {
    // CRITICAL GUARD: If authentication is in progress or no user is logged in,
    // do not construct the query. Return null to prevent any Firestore operation.
    if (isUserLoading || !user) {
      return null;
    }

    // If we reach here, we are certain that `user.uid` is available.
    const constraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    ];

    if (marketId) {
      constraints.unshift(where('marketId', '==', marketId));
    }

    return query(collection(firestore, 'orders'), ...constraints);
  }, [firestore, user, isUserLoading, marketId]); 

  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  // The hook's loading state is true if auth is loading OR the query is running.
  return { data, isLoading: isUserLoading || isLoading, error };
}
