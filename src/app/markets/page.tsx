
'use client';

import { useState, useEffect } from 'react';
import type { Market } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketsTable } from '@/components/markets/markets-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CandlestickChart } from 'lucide-react';

const MOCK_MARKETS: Market[] = [
    { id: 'BTC-USDT', baseAssetId: 'BTC', quoteAssetId: 'USDT', minOrderSize: 0.00001, pricePrecision: 2, quantityPrecision: 6, makerFee: 0.001, takerFee: 0.001, createdAt: '2024-01-01T00:00:00Z', change: 1.2, volume: 50000000 },
    { id: 'ETH-USDT', baseAssetId: 'ETH', quoteAssetId: 'USDT', minOrderSize: 0.0001, pricePrecision: 2, quantityPrecision: 4, makerFee: 0.001, takerFee: 0.001, createdAt: '2024-01-01T00:00:00Z', change: -2.5, volume: 30000000 },
    { id: 'SOL-USDT', baseAssetId: 'SOL', quoteAssetId: 'USDT', minOrderSize: 0.01, pricePrecision: 2, quantityPrecision: 2, makerFee: 0.001, takerFee: 0.001, createdAt: '2024-01-01T00:00:00Z', change: 5.8, volume: 25000000 },
    { id: 'DOGE-USDT', baseAssetId: 'DOGE', quoteAssetId: 'USDT', minOrderSize: 10, pricePrecision: 6, quantityPrecision: 0, makerFee: 0.001, takerFee: 0.001, createdAt: '2024-01-01T00:00:00Z', change: -0.5, volume: 15000000 }
];

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate fetching data
    setIsLoading(true);
    const timer = setTimeout(() => {
      setMarkets(MOCK_MARKETS);
      setIsLoading(false);
    }, 1000); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
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
          <AlertDescription>
            {error.message || "Failed to load market data. Please check your Firestore security rules and network connection."}
          </AlertDescription>
        </Alert>
      );
    }

    if (!markets || markets.length === 0) {
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
    
    return <MarketsTable markets={markets} />;
  }


  return (
    <div className="flex flex-col gap-8">
       <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Markets
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Explore real-time market data from the Fort Knox Exchange.
        </p>
      </div>
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
    </div>
  );
}
