
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    // CRITICAL: Do not build a query until both firestore and the user's UID are available.
    // This prevents an unauthorized query from being built and sent.
    if (!firestore || !user?.uid) {
      return null;
    }

    // Base constraints: always filter by the current user's ID.
    const queryConstraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ];
    
    // If a marketId is provided, add it as an additional filter.
    if (marketId) {
        // This line was incorrect. It should be prepended to the array.
        // Also, the field path needs to be correct.
        queryConstraints.unshift(where('marketId', '==', marketId));
    }

    // Construct and return the final query.
    return query(collection(firestore, 'orders'), ...queryConstraints);

  }, [firestore, user?.uid, marketId]); // Dependencies ensure the query rebuilds if user or market changes.
  
  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  // If the user is loading, we should also be in a loading state.
  return { data, isLoading: isUserLoading || isLoading, error };
}
