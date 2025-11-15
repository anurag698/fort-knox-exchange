
'use client';

import { useState, useEffect } from 'react';
import type { Market, Asset } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  price?: number;
};

type MarketsTableProps = {
  initialMarkets: EnrichedMarket[];
};

export function MarketsTable({ initialMarkets }: MarketsTableProps) {
  const [markets, setMarkets] = useState<EnrichedMarket[]>(initialMarkets);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [wsError, setWsError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialMarkets || initialMarkets.length === 0) return;

    const marketSymbols = initialMarkets.map(m => `${m.baseAssetId}${m.quoteAssetId}`);
    if (marketSymbols.length === 0) return;

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${marketSymbols.map(s => `${s.toLowerCase()}@trade`).join('/')}`);
    
    ws.onmessage = (event) => {
      const wsData = JSON.parse(event.data);
      if (wsData && wsData.s && wsData.p) {
        setPrices(prevPrices => ({
          ...prevPrices,
          [wsData.s]: parseFloat(wsData.p),
        }));
      }
    };
    
    ws.onerror = (err) => {
        console.error("Markets WebSocket error:", err);
        setWsError("Failed to connect to live price feed. Displaying static data.");
    }

    return () => {
      ws.close();
    };
  }, [initialMarkets]);

  useEffect(() => {
    setMarkets(prevMarkets => 
        prevMarkets.map(market => ({
            ...market,
            price: prices[`${market.baseAssetId}${market.quoteAssetId}`] ?? market.price,
        }))
    );
  }, [prices]);

  return (
    <>
    {wsError && (
       <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Live Data Error</AlertTitle>
        <AlertDescription>{wsError}</AlertDescription>
      </Alert>
    )}
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Market</TableHead>
            <TableHead>Last Price</TableHead>
            <TableHead>24h Change</TableHead>
            <TableHead className="text-right">24h Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            const isPositive = market.change >= 0;
            const currentPrice = prices[`${market.baseAssetId}${market.quoteAssetId}`];

            return (
              <TableRow key={market.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{market.baseAsset?.symbol ?? '...'}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{market.quoteAsset?.symbol ?? '...'}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("font-mono", currentPrice ? (isPositive ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground')}>
                  {currentPrice ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: market.pricePrecision})}` : <Skeleton className="h-4 w-20" />}
                </TableCell>
                <TableCell className={cn("flex items-center gap-1", isPositive ? 'text-green-600' : 'text-red-600')}>
                  {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {market.change.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right font-mono">${market.volume.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
