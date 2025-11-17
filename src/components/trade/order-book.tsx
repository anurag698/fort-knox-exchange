'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarkets } from '@/hooks/use-markets';
import { cn } from '@/lib/utils';

export type ProcessedOrder = {
  price: number;
  quantity: number;
  total: number;
};

interface OrderBookProps {
  onPriceSelect: (price: number) => void;
  marketId: string;
}

const AGGREGATION_LEVELS = [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100];

// Helper to get flash animation class
const getFlashClass = (prev: number | undefined, current: number) => {
  if (prev === undefined) return "";
  if (current > prev) return "flash-green";
  if (current < prev) return "flash-red";
  return "";
};

export function OrderBook({ onPriceSelect, marketId }: OrderBookProps) {
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: markets } = useMarkets();
  
  const market = markets?.find(m => m.id === marketId);
  const pricePrecision = market?.pricePrecision ?? 2;
  const quantityPrecision = market?.quantityPrecision ?? 4;
  
  const [aggregation, setAggregation] = useState(AGGREGATION_LEVELS[0]);
  const [baseAsset, quoteAsset] = marketId ? marketId.split('-') : ['', ''];

  const prevBidsRef = useRef<Map<number, number>>(new Map());
  const prevAsksRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (!marketId) {
      setIsLoading(false);
      setError(new Error("Market ID is not specified."));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setBids([]);
    setAsks([]);
    prevBidsRef.current.clear();
    prevAsksRef.current.clear();

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${marketId.replace('-', '').toLowerCase()}@depth20@100ms`);

    ws.onopen = () => setIsLoading(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.bids && data.asks) {
        setBids(data.bids);
        setAsks(data.asks);
      }
    };
    ws.onerror = (event) => {
      setError(new Error('Failed to connect to the order book feed.'));
      setIsLoading(false);
    };

    return () => ws.close();
  }, [marketId]);

  const groupOrders = (orders: [string, string][], aggLevel: number, side: 'bids' | 'asks'): ProcessedOrder[] => {
    if (!orders) return [];
    const grouped: { [key: string]: { quantity: number; total: number } } = {};

    for (const [priceStr, quantityStr] of orders) {
      const price = parseFloat(priceStr);
      const quantity = parseFloat(quantityStr);
      const groupKey = (side === 'bids' ? Math.floor(price / aggLevel) : Math.ceil(price / aggLevel)) * aggLevel;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = { quantity: 0, total: 0 };
      }
      grouped[groupKey].quantity += quantity;
      grouped[groupKey].total += price * quantity;
    }

    return Object.entries(grouped).map(([priceStr, data]) => ({
      price: parseFloat(priceStr),
      quantity: data.quantity,
      total: data.total,
    }));
  };

  const processedBids = useMemo(() => groupOrders(bids, aggregation, 'bids').sort((a,b) => b.price - a.price), [bids, aggregation]);
  const processedAsks = useMemo(() => groupOrders(asks, aggregation, 'asks').sort((a,b) => a.price - b.price), [asks, aggregation]);
  
  useEffect(() => {
    const bidsMap = new Map(processedBids.map(o => [o.price, o.quantity]));
    const asksMap = new Map(processedAsks.map(o => [o.price, o.quantity]));
    prevBidsRef.current = bidsMap;
    prevAsksRef.current = asksMap;
  }, [processedBids, processedAsks]);

  const maxTotal = Math.max(...processedBids.map(o => o.total), ...processedAsks.map(o => o.total), 0);

  const bestAsk = processedAsks.length > 0 ? processedAsks[0].price : null;
  const bestBid = processedBids.length > 0 ? processedBids[0].price : null;
  const spread = bestAsk && bestBid ? (bestAsk - bestBid).toFixed(pricePrecision) : '-';

  const renderOrderList = (orders: ProcessedOrder[], isBid: boolean) => {
    if (orders.length === 0 && !isLoading) {
      return (
        <div className="text-center text-xs text-muted-foreground py-4">
          No {isBid ? 'bids' : 'asks'}
        </div>
      );
    }
    
    const displayOrders = isBid ? orders : [...orders].reverse();
    const prevMap = isBid ? prevBidsRef.current : prevAsksRef.current;

    return (
      <div className="space-y-1">
        {displayOrders.map((order) => {
          const flashClass = getFlashClass(prevMap.get(order.price), order.quantity);
          return (
            <div 
              key={order.price} 
              className={cn("flex justify-between text-xs font-mono relative cursor-pointer hover:bg-muted/50 p-0.5", flashClass)}
              onClick={() => onPriceSelect(order.price)}
            >
              <div 
                className={`absolute top-0 right-0 h-full ${isBid ? 'bg-green-500/10' : 'bg-red-500/10'}`} 
                style={{ width: `${(order.total / maxTotal) * 100}%`}}
              />
              <span className={`z-10 w-1/3 text-left ${isBid ? "text-green-500" : "text-red-500"}`}>{order.price.toFixed(pricePrecision)}</span>
              <span className="z-10 w-1/3 text-right">{order.quantity.toFixed(quantityPrecision)}</span>
              <span className="z-10 w-1/3 text-right">{order.total.toFixed(2)}</span>
            </div>
          )
        })}
      </div>
    );
  };

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
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
            <span>Price ({quoteAsset})</span>
            <span className="text-right">Amount ({baseAsset})</span>
            <span className="text-right">Total</span>
          </div>
          {renderOrderList(processedAsks, false)}
        </div>

        <div className="py-2 text-center text-lg font-bold">
            {bestBid?.toFixed(pricePrecision) ?? '---'}
             <span className="text-xs text-muted-foreground ml-2">Spread {spread}</span>
        </div>

        <div>
          {renderOrderList(processedBids, true)}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 flex-row items-center justify-between">
        <CardTitle className="text-lg">Order Book</CardTitle>
        <Select value={aggregation.toString()} onValueChange={(v) => setAggregation(Number(v))}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {AGGREGATION_LEVELS.map(level => (
                    <SelectItem key={level} value={level.toString()}>{level}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
