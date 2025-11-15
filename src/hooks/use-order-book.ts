'use client';

import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';

export type ProcessedOrder = {
  price: number;
  quantity: number;
  total: number;
};

export function useOrderBook(marketId: string) {
  const firestore = useFirestore();

  const ordersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'orders') : null),
    [firestore]
  );

  const ordersQuery = useMemoFirebase(
    () => {
      if (!ordersCollection || !marketId) return null;
      return query(
        ordersCollection,
        where('marketId', '==', marketId),
        where('status', '==', 'OPEN')
      );
    },
    [ordersCollection, marketId]
  );

  const { data: orders, ...rest } = useCollection<Order>(ordersQuery);

  const { bids, asks } = useMemo(() => {
    if (!orders) {
      return { bids: [], asks: [] };
    }

    const bidsMap = new Map<number, number>();
    const asksMap = new Map<number, number>();

    orders.forEach(order => {
        if(order.price === undefined) return;

        if (order.side === 'BUY') {
            const existingQty = bidsMap.get(order.price) || 0;
            bidsMap.set(order.price, existingQty + order.quantity);
        } else {
            const existingQty = asksMap.get(order.price) || 0;
            asksMap.set(order.price, existingQty + order.quantity);
        }
    });

    const processMap = (map: Map<number, number>): ProcessedOrder[] => {
        return Array.from(map.entries()).map(([price, quantity]) => ({
            price,
            quantity,
            total: price * quantity,
        }));
    }

    const bids = processMap(bidsMap).sort((a, b) => b.price - a.price);
    const asks = processMap(asksMap).sort((a, b) => a.price - b.price);

    return { bids, asks };
  }, [orders]);

  return { bids, asks, ...rest };
}
