
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    // CRITICAL GUARD:
    // If authentication is still loading or if there is no user,
    // return null immediately. This prevents any query from being built
    // and sent to Firestore, thus avoiding the permission error.
    if (isUserLoading || !user) {
      return null;
    }

    // If the code reaches here, we are certain 'user.uid' is available.
    const constraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    ];

    if (marketId) {
      // unshift adds the marketId filter to the beginning of the constraints array
      // for optimal query performance if a composite index is defined.
      constraints.unshift(where('marketId', '==', marketId));
    }

    return query(collection(firestore, 'orders'), ...constraints);
    
    // The dependencies ensure the query is re-evaluated only when necessary.
  }, [firestore, user, isUserLoading, marketId]);

  // Pass the potentially null query to useCollection.
  // The useCollection hook is designed to handle a null query gracefully.
  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  // The hook's loading state should reflect both the auth loading and data fetching state.
  return { data, isLoading: isUserLoading || isLoading, error };
}
