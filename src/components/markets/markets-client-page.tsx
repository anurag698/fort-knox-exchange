
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, Asset } from '@/lib/types';
import { MarketsTable } from '@/components/markets/markets-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CandlestickChart } from 'lucide-react';
import { useMarketsData } from '@/hooks/use-markets-data';

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  price: number;
};

export function MarketsClientPage() {
  const { data, isLoading, error } = useMarketsData();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [wsError, setWsError] = useState<string | null>(null);

  const assetsMap = useMemo(() => {
    if (!data?.assets) return new Map();
    return new Map(data.assets.map(asset => [asset.id, asset]));
  }, [data?.assets]);

  useEffect(() => {
    if (!data?.markets || data.markets.length === 0) return;

    const marketSymbols = data.markets.map(m => `${m.baseAssetId}${m.quoteAssetId}`);
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
        setWsError("Failed to connect to live price feed.");
    }

    return () => {
      ws.close();
    };
  }, [data?.markets]);

  const enrichedMarkets = useMemo(() => {
    if (!data?.markets || !data?.assets) return [];
    
    return data.markets.map(market => {
      const price = prices[`${market.baseAssetId}${market.quoteAssetId}`] ?? 0;
      return {
        ...market,
        price,
        baseAsset: assetsMap.get(market.baseAssetId),
        quoteAsset: assetsMap.get(market.quoteAssetId),
      };
    }).filter(m => m.baseAsset && m.quoteAsset);
  }, [data, assetsMap, prices]);
  
  const finalError = error || wsError;

  if (isLoading) {
    return (
      <div className="w-full space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (finalError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Market Data</AlertTitle>
        <AlertDescription>{typeof finalError === 'string' ? finalError : (finalError as Error).message}</AlertDescription>
      </Alert>
    );
  }

  if (enrichedMarkets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <CandlestickChart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No Markets Found</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          There are currently no markets available. Please try seeding the database.
        </p>
      </div>
    );
  }
  
  return <MarketsTable markets={enrichedMarkets} />;
}
