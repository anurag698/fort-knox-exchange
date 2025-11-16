'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Order } from '@/lib/types';

/**
 * Fetches orders for a specific user and optionally filters by market.
 * This hook is now safe to use as it will not execute a query until
 * the user is authenticated.
 * @param userId The UID of the user whose orders are to be fetched.
 * @param marketId Optional market ID to filter orders.
 */
export function useOrders(userId?: string, marketId?: string) {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    // Guard: Do not build the query if the userId isn't available.
    if (!firestore || !userId) {
      return null;
    }

    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (marketId) {
      constraints.unshift(where('marketId', '==', marketId));
    }

    return query(collection(firestore, 'orders'), ...constraints);
    
  }, [firestore, userId, marketId]); 

  // The useCollection hook is now passed an `enabled` flag.
  // It will only run the query if auth is finished and we have a valid query object.
  const { data, isLoading, error } = useCollection<Order>(ordersQuery, {
    enabled: !isUserLoading && !!ordersQuery,
  });

  return { 
    data, 
    // The overall loading state is true if auth is loading OR the query is loading.
    isLoading: isUserLoading || isLoading, 
    error 
  };
}
