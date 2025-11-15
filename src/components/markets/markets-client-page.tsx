
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, Asset } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketsTable } from '@/components/markets/markets-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CandlestickChart } from 'lucide-react';

type EnrichedMarket = Market & {
    baseAsset?: Asset;
    quoteAsset?: Asset;
};

interface MarketsClientPageProps {
    initialMarkets: EnrichedMarket[];
    error: string | null;
}

export function MarketsClientPage({ initialMarkets, error: initialError }: MarketsClientPageProps) {
  const [markets, setMarkets] = useState(initialMarkets);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(initialMarkets.length === 0 && !initialError);
  const [error, setError] = useState<string | null>(initialError);

  useEffect(() => {
    if (markets.length === 0) return;

    const marketSymbols = markets.map(m => `${m.baseAssetId}${m.quoteAssetId}`);
    if (marketSymbols.length === 0) {
        setIsLoading(false);
        return;
    }

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

    ws.onopen = () => {
      setIsLoading(false);
    }
    
    ws.onerror = (err) => {
        console.error("Markets WebSocket error:", err);
        setError("Failed to connect to live price feed.");
        setIsLoading(false);
    }

    return () => {
      ws.close();
    };
  }, [markets]);

  const enrichedMarkets = useMemo(() => {
    return markets.map(market => {
      const price = prices[`${market.baseAssetId}${market.quoteAssetId}`] ?? 0;
      return {
        ...market,
        price,
      };
    });
  }, [markets, prices]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Market Data</AlertTitle>
          <AlertDescription>
            {error || "Failed to load market data. Please check your Firestore security rules and network connection."}
          </AlertDescription>
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
            There are currently no markets available to trade. Have you seeded the database?
          </p>
        </div>
      );
    }
    
    return <MarketsTable markets={enrichedMarkets} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Pairs</CardTitle>
        <CardDescription>
          All available markets for trading on the exchange.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
