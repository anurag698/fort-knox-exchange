
'use client';

import { collection, query, where, orderBy, type QueryConstraint } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export function useOrders(marketId?: string) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    // Await user authentication before constructing the query.
    // If we are loading or there is no user, return null to prevent an invalid query.
    if (isUserLoading || !user?.uid) {
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
  }, [firestore, user?.uid, marketId, isUserLoading]); 

  const { data, isLoading, error } = useCollection<Order>(ordersQuery);

  // The overall loading state depends on both the user loading and the collection loading.
  return { data, isLoading: isUserLoading || isLoading, error };
}
