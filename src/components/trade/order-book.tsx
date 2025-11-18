// This component displays the real-time order book with bids and asks.
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { cn } from "@/lib/utils";
import type { RawOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Lock, Unlock } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMarketDataStore } from "@/lib/market-data-service";

type Order = { price: number; quantity: number; total: number };
type Props = {
  onPriceSelect: (p: number) => void;
  marketId: string;
  aggregationLevels?: number[];
  defaultAggregation?: number;
  height?: number;
  rowHeight?: number;
};

const DEFAULT_ROW_HEIGHT = 22;

function groupOrders(orders: RawOrder[], agg: number): Order[] {
  const map = new Map<number, { price: number; quantity: number; total: number }>();
  for (const [priceStr, amountStr] of orders) {
    const price = parseFloat(priceStr);
    const amount = parseFloat(amountStr);
    const groupedPrice = Math.round(price / agg) * agg;

    const existing = map.get(groupedPrice);
    if (!existing) {
      map.set(groupedPrice, { price: groupedPrice, quantity: amount, total: amount * groupedPrice });
    } else {
      existing.quantity += amount;
      existing.total += amount * groupedPrice;
    }
  }
  return Array.from(map.values());
}

export function OrderBook({
  onPriceSelect,
  marketId,
  aggregationLevels = [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100],
  defaultAggregation = 0.5,
  height = 480,
  rowHeight = DEFAULT_ROW_HEIGHT,
}: Props) {
  const [aggregation, setAggregation] = useState<number>(defaultAggregation);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [baseAsset, quoteAsset] = marketId.split('-');

  const bids = useMarketDataStore(state => state.bids);
  const asks = useMarketDataStore(state => state.asks);
  const isLoading = useMarketDataStore(state => !state.isConnected && state.bids.length === 0);
  const error = useMarketDataStore(state => state.error);

  const groupedAsks = useMemo(() => groupOrders(asks, aggregation).sort((a, b) => b.price - a.price), [asks, aggregation]);
  const groupedBids = useMemo(() => groupOrders(bids, aggregation).sort((a, b) => b.price - a.price), [bids, aggregation]);

  const maxTotal = useMemo(() => {
    const asksTotal = groupedAsks.reduce((sum, o) => sum + o.total, 0);
    const bidsTotal = groupedBids.reduce((sum, o) => sum + o.total, 0);
    return Math.max(asksTotal, bidsTotal, 1);
  }, [groupedAsks, groupedBids]);

  const bestAsk = asks.length > 0 ? parseFloat(asks[0][0]) : null;
  const bestBid = bids.length > 0 ? parseFloat(bids[0][0]) : null;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : null;

  const asksListRef = useRef<List | null>(null);
  const bidsListRef = useRef<List | null>(null);
  const spreadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollLocked || !spreadRef.current) return;
    spreadRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
  }, [bids, asks, scrollLocked]);

  const Row = useCallback(
    ({ index, style, data }: { index: number; style: React.CSSProperties, data: { items: Order[], side: 'bid' | 'ask'} }) => {
      const { items, side } = data;
      const item = items[index];
      if (!item) return null;

      const isBid = side === 'bid';
      const color = isBid ? 'text-green-500' : 'text-red-500';
      const bgColor = isBid ? 'bg-green-500/20' : 'bg-red-500/20';

      return (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onPriceSelect?.(item.price)}
          style={style}
          className="px-2 flex justify-between items-center text-xs relative hover:bg-muted font-mono"
        >
          <div className={cn("absolute top-0 right-0 h-full", bgColor)} style={{width: `${(item.total / maxTotal) * 100}%`}} />
          <span className={cn("w-1/3 text-left z-10", color)}>{item.price.toFixed(2)}</span>
          <span className="w-1/3 text-right z-10">{item.quantity.toFixed(4)}</span>
          <span className="w-1/3 text-right text-muted-foreground z-10">{item.total.toFixed(2)}</span>
        </div>
      );
    },
    [onPriceSelect, maxTotal]
  );
  
  if (isLoading) {
    return <Card className="h-full"><CardHeader className="p-4"><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="p-4 pt-0"><div className="space-y-2">{[...Array(15)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div></CardContent></Card>;
  }

  if (error) {
    return <Card><CardHeader className="p-4"><CardTitle className="text-lg">Order Book</CardTitle></CardHeader><CardContent className="p-4 pt-0"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></CardContent></Card>;
  }

  return (
    <Card className="h-full flex flex-col">
       <CardHeader className="p-4 flex-row items-center justify-between">
        <CardTitle className="text-lg">Order Book</CardTitle>
        <div className='flex items-center gap-2'>
            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScrollLocked(!scrollLocked)}>{scrollLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent><p>{scrollLocked ? "Unlock Scroll" : "Lock Scroll"}</p></TooltipContent></Tooltip></TooltipProvider>
            <Select value={aggregation.toString()} onValueChange={(v) => setAggregation(Number(v))}><SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{aggregationLevels.map(level => (<SelectItem key={level} value={level.toString()}>{level}</SelectItem>))}</SelectContent></Select>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow flex flex-col">
         <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
          <span>Price ({quoteAsset})</span>
          <span className="text-right">Amount ({baseAsset})</span>
          <span className="text-right">Total</span>
        </div>
        <div className="flex-grow overflow-y-hidden" style={{height: `${height}px`}}>
            <List height={height / 2 - 20} itemCount={groupedAsks.length} itemSize={rowHeight} width="100%" ref={asksListRef} itemData={{items: groupedAsks, side: 'ask'}}>{Row}</List>
            <div className="py-2 text-center text-lg font-bold border-y my-1" ref={spreadRef}>
                {bestBid?.toFixed(2) ?? '---'}
                {spread && <span className="text-xs text-muted-foreground ml-2">Spread {spread.toFixed(2)}</span>}
            </div>
            <List height={height / 2 - 20} itemCount={groupedBids.length} itemSize={rowHeight} width="100%" ref={bidsListRef} itemData={{items: groupedBids, side: 'bid'}}>{Row}</List>
        </div>
      </CardContent>
    </Card>
  );
}
