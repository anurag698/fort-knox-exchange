'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, Asset } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketsTable } from '@/components/markets/markets-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CandlestickChart } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { useAssets } from '@/hooks/use-assets';

export default function MarketsPage() {
  const firestore = useFirestore();
  const [markets, setMarkets] = useState<Market[]>([]);
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) {
      setIsLoading(true);
      return;
    }
    const fetchMarkets = async () => {
        try {
            const marketsQuery = query(collection(firestore, 'markets'));
            const marketsSnapshot = await getDocs(marketsQuery);
            const marketsData = marketsSnapshot.docs.map(doc => {
                 // Mock change and volume for display as these are not in the DB
                const change = (doc.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1;
                const volume = (doc.id.charCodeAt(1) % 100) * 100000 + Math.random() * 50000;
                return { id: doc.id, ...doc.data(), change, volume } as Market;
            });
            setMarkets(marketsData);
        } catch(err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        }
    }
    fetchMarkets();
  }, [firestore]);

  useEffect(() => {
    if (markets.length === 0 || assetsLoading) return;
    
    setIsLoading(false);

    const marketSymbols = markets.map(m => `${m.baseAssetId}${m.quoteAssetId}`);
    if (marketSymbols.length === 0) {
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
    
    ws.onerror = (err) => {
        console.error("Markets WebSocket error:", err);
        setError("Failed to connect to live price feed.");
    }

    return () => {
      ws.close();
    };
  }, [markets, assetsLoading]);

  const enrichedMarkets = useMemo(() => {
    if (!assets) return [];
    const assetsMap = new Map(assets.map(asset => [asset.id, asset]));
    
    return markets.map(market => {
      const price = prices[`${market.baseAssetId}${market.quoteAssetId}`] ?? 0;
      return {
        ...market,
        price,
        baseAsset: assetsMap.get(market.baseAssetId),
        quoteAsset: assetsMap.get(market.quoteAssetId),
      };
    });
  }, [markets, assets, prices]);

  const renderContent = () => {
    if (isLoading || assetsLoading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      );
    }

    if (error || assetsError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Market Data</AlertTitle>
          <AlertDescription>
            {error || (assetsError as Error)?.message || "Failed to load market data. Please check your Firestore security rules and network connection."}
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
