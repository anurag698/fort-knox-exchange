
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Order } from '@/lib/types';


export type ProcessedOrder = {
  price: number;
  quantity: number;
  total: number;
};

interface OrderBookProps {
  onPriceSelect: (price: number) => void;
  marketId: string;
}

export function OrderBook({ onPriceSelect, marketId }: OrderBookProps) {
  const firestore = useFirestore();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [baseAsset, quoteAsset] = marketId.split('-');
  
  useEffect(() => {
    if (!firestore) return;
    setIsLoading(true);

    const q = query(
      collection(firestore, 'orders'),
      where('marketId', '==', marketId),
      where('status', '==', 'OPEN')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({...doc.data() as Order, id: doc.id}));
      setOrders(fetchedOrders);
      setIsLoading(false);
    }, (err) => {
      setError(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, marketId]);


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


  const renderOrderList = (orders: ProcessedOrder[], isBid: boolean) => {
    if (orders.length === 0) {
      return (
        <div className="text-center text-xs text-muted-foreground py-4">
          No {isBid ? 'bids' : 'asks'}
        </div>
      )
    }

    // Determine the max total for visualization
    const maxTotal = Math.max(...orders.map(o => o.total), 0);

    return (
      <div className="space-y-1">
        {orders.slice(0, 7).map((order, index) => (
          <div 
            key={index} 
            className="flex justify-between text-xs font-mono relative cursor-pointer hover:bg-muted/50 p-0.5"
            onClick={() => onPriceSelect(order.price)}
          >
            <div 
              className={`absolute top-0 right-0 h-full ${isBid ? 'bg-green-500/10' : 'bg-red-500/10'}`} 
              style={{ width: `${(order.total / maxTotal) * 100}%`}}
            />
            <span className={`z-10 ${isBid ? "text-green-500" : "text-red-500"}`}>{order.price.toFixed(2)}</span>
            <span className="z-10">{order.quantity.toFixed(4)}</span>
            <span className="z-10">{order.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (error) {
       return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
              Failed to load order book.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
            <span>Price ({quoteAsset})</span>
            <span>Amount ({baseAsset})</span>
            <span>Total</span>
          </div>
          {renderOrderList(asks.reverse(), false)}
        </div>

        <div className="py-2 text-center text-lg font-bold">
            {bids[0]?.price.toFixed(2) ?? '---'}
        </div>

        <div>
          {renderOrderList(bids, true)}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Order Book</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
