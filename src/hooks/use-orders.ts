'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Order } from '@/lib/types';

/**
 * Fetches orders for a specific user and optionally filters by market.
 * This hook now queries the `users/{userId}/orders` subcollection.
 * @param userId The UID of the user whose orders are to be fetched.
 * @param marketId Optional market ID to filter orders.
 */
export function useOrders(userId?: string, marketId?: string) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Use the passed userId or fallback to the authenticated user's ID
  const targetUserId = userId || user?.uid;

  const ordersQuery = useMemoFirebase(() => {
    // Guard: Do not build the query if the userId isn't available.
    if (!firestore || !targetUserId) {
      return null;
    }

    // Query the subcollection path: `users/{userId}/orders`
    const ordersCollectionRef = collection(firestore, 'users', targetUserId, 'orders');

    const constraints: QueryConstraint[] = [];

    if (marketId) {
      constraints.push(where('marketId', '==', marketId));
    }
    
    // We remove the orderBy here to avoid needing a composite index.
    // Sorting will be done on the client.
    // constraints.push(orderBy('createdAt', 'desc'));

    return query(ordersCollectionRef, ...constraints);
    
  }, [firestore, targetUserId, marketId]); 

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
