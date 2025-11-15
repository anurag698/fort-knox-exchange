
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
};

type MarketWithLiveData = EnrichedMarket & {
  price?: number;
  change24h?: number;
  volume24h?: number;
}

type MarketsTableProps = {
  markets: EnrichedMarket[];
};

export function MarketsTable({ markets: initialMarkets }: MarketsTableProps) {
  const [markets, setMarkets] = useState<MarketWithLiveData[]>(initialMarkets.map(m => ({ ...m })));
  const [wsError, setWsError] = useState<string | null>(null);

  const marketSymbols = useMemo(() => {
    return initialMarkets
      .map(m => (m.baseAsset && m.quoteAsset) ? `${m.baseAsset.symbol}${m.quoteAsset.symbol}` : null)
      .filter(Boolean) as string[];
  }, [initialMarkets]);

  useEffect(() => {
    if (marketSymbols.length === 0) return;

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${marketSymbols.map(s => `${s.toLowerCase()}@ticker`).join('/')}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.s && data.p && data.P && data.v) {
          setMarkets(prevMarkets => 
            prevMarkets.map(market => {
              const marketSymbol = market.baseAsset?.symbol && market.quoteAsset?.symbol
                ? `${market.baseAsset.symbol}${market.quoteAsset.symbol}`
                : '';
              
              if (marketSymbol === data.s) {
                return {
                  ...market,
                  price: parseFloat(data.p),
                  change24h: parseFloat(data.P),
                  volume24h: parseFloat(data.v) * parseFloat(data.p), // Volume in quote asset
                };
              }
              return market;
            })
          );
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };
    
    ws.onerror = (err) => {
        console.error("Markets WebSocket error:", err);
        setWsError("Failed to connect to live price feed. Displaying static data.");
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [marketSymbols]);

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
            const isPositive = market.change24h ? market.change24h >= 0 : true;
            const price = market.price;
            const change = market.change24h;
            const volume = market.volume24h;

            return (
              <TableRow key={market.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{market.baseAsset?.symbol ?? '...'}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{market.quoteAsset?.symbol ?? '...'}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("font-mono", price ? (isPositive ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground')}>
                  {price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: market.pricePrecision, maximumFractionDigits: market.pricePrecision})}` : <Skeleton className="h-4 w-20" />}
                </TableCell>
                <TableCell className={cn(change ? (isPositive ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground')}>
                  {change ? `${change.toFixed(2)}%` : <Skeleton className="h-4 w-12" />}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {volume ? `$${volume.toLocaleString(undefined, {maximumFractionDigits: 0})}` : <Skeleton className="h-4 w-24 ml-auto" />}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
