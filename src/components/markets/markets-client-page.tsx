
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, Asset } from '@/lib/types';
import { MarketsTable } from '@/components/markets/markets-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CandlestickChart } from 'lucide-react';
import { useMarkets } from '@/hooks/use-markets';
import { useAssets } from '@/hooks/use-assets';

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  price: number;
};

export function MarketsClientPage() {
  const { data: marketsData, isLoading: marketsLoading, error: marketsError } = useMarkets();
  const { data: assetsData, isLoading: assetsLoading, error: assetsError } = useAssets();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [wsError, setWsError] = useState<string | null>(null);

  const assetsMap = useMemo(() => {
    if (!assetsData) return new Map();
    return new Map(assetsData.map(asset => [asset.id, asset]));
  }, [assetsData]);

  useEffect(() => {
    if (!marketsData || marketsData.length === 0) return;

    const marketSymbols = marketsData.map(m => `${m.baseAssetId}${m.quoteAssetId}`);
    if (marketSymbols.length === 0) return;

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${marketSymbols.map(s => `${s.toLowerCase()}@trade`).join('/')}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data && data.s && data.p) {
        setPrices(prevPrices => ({
          ...prevPrices,
          [data.s]: parseFloat(data.p),
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
  }, [marketsData]);

  const enrichedMarkets = useMemo(() => {
    if (!marketsData || !assetsData) return [];
    
    return marketsData.map(market => {
      const price = prices[`${market.baseAssetId}${market.quoteAssetId}`] ?? 0;
      return {
        ...market,
        price,
        baseAsset: assetsMap.get(market.baseAssetId),
        quoteAsset: assetsMap.get(market.quoteAssetId),
      };
    }).filter(m => m.baseAsset && m.quoteAsset);
  }, [marketsData, assetsData, assetsMap, prices]);
  
  const isLoading = marketsLoading || assetsLoading;
  const error = marketsError || assetsError || wsError;

  if (isLoading) {
    return (
      <div className="w-full space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Market Data</AlertTitle>
        <AlertDescription>{typeof error === 'string' ? error : (error as Error).message}</AlertDescription>
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
