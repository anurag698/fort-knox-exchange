
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [baseAsset, quoteAsset] = marketId.split('-');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setBids([]);
    setAsks([]);

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${marketId.replace('-', '').toLowerCase()}@depth20@100ms`);

    ws.onopen = () => {
      setIsLoading(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.bids && data.asks) {
        setBids(data.bids);
        setAsks(data.asks);
      }
    };

    ws.onerror = (err) => {
      console.error('OrderBook WebSocket error:', err);
      setError(new Error('Failed to connect to the order book feed.'));
      setIsLoading(false);
    };

    ws.onclose = () => {
      // You might want to implement a reconnection logic here
    };

    return () => {
      ws.close();
    };
  }, [marketId]);

  const processOrders = (orders: [string, string][]): ProcessedOrder[] => {
    return orders.map(([price, quantity]) => {
      const priceNum = parseFloat(price);
      const quantityNum = parseFloat(quantity);
      return {
        price: priceNum,
        quantity: quantityNum,
        total: priceNum * quantityNum,
      };
    });
  };

  const processedBids = useMemo(() => processOrders(bids), [bids]);
  const processedAsks = useMemo(() => processOrders(asks).sort((a, b) => b.price - a.price), [asks]);


  const renderOrderList = (orders: ProcessedOrder[], isBid: boolean) => {
    if (orders.length === 0 && !isLoading) {
      return (
        <div className="text-center text-xs text-muted-foreground py-4">
          No {isBid ? 'bids' : 'asks'}
        </div>
      )
    }

    const maxTotal = Math.max(...orders.map(o => o.total), 0);

    return (
      <div className="space-y-1">
        {orders.map((order, index) => (
          <div 
            key={index} 
            className="flex justify-between text-xs font-mono relative cursor-pointer hover:bg-muted/50 p-0.5"
            onClick={() => onPriceSelect(order.price)}
          >
            <div 
              className={`absolute top-0 ${isBid ? 'left-0' : 'right-0'} h-full ${isBid ? 'bg-green-500/10' : 'bg-red-500/10'}`} 
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
        <div className="space-y-2">
          {[...Array(15)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      );
    }

    if (error) {
       return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
              {error.message}
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
          {renderOrderList(processedAsks, false)}
        </div>

        <div className="py-2 text-center text-lg font-bold">
            {processedBids[0]?.price.toFixed(2) ?? '---'}
        </div>

        <div>
          {renderOrderList(processedBids, true)}
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
