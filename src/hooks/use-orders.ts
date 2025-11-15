
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    // Explicitly return null if the user is loading or not authenticated.
    // This prevents an invalid query from ever being created.
    if (isUserLoading || !user?.uid) {
      return null;
    }

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
  }, [firestore, user?.uid, marketId, isUserLoading]); 

  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  // The overall loading state depends on both the user loading and the collection loading.
  return { data, isLoading: isUserLoading || isLoading, error };
}
