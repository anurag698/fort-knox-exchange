
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

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const marketsQuery = query(collection(firestore, 'markets'));
        const assetsQuery = query(collection(firestore, 'assets'));

        const [marketsSnapshot, assetsSnapshot] = await Promise.all([
          getDocs(marketsQuery),
          getDocs(assetsQuery),
        ]);

        const marketsData = marketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Market));
        const assetsData = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
        
        setMarkets(marketsData);
        setAssets(assetsData);

        // Don't stop loading here, wait for price socket to connect
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred.'));
        setIsLoading(false); // Stop loading on error
      }
    };

    fetchData();
  }, [firestore]);

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
      // Now we have initial data and a price feed, so loading is complete
      setIsLoading(false);
    }
    
    ws.onerror = (err) => {
        console.error("Markets WebSocket error:", err);
        setError(new Error("Failed to connect to live price feed."));
        setIsLoading(false);
    }

    return () => {
      ws.close();
    };
  }, [markets]);

  const enrichedMarkets = useMemo(() => {
    const assetsMap = new Map(assets.map(asset => [asset.id, asset]));

    return markets.map(market => {
      const baseAsset = assetsMap.get(market.baseAssetId);
      const quoteAsset = assetsMap.get(market.quoteAssetId);
      const price = prices[`${market.baseAssetId}${market.quoteAssetId}`] ?? 0;
      // Mock change and volume for display
      const change = (market.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1;
      const volume = (market.id.charCodeAt(1) % 100) * 100000 + Math.random() * 50000;

      return {
        ...market,
        baseAsset,
        quoteAsset,
        price,
        change,
        volume,
      };
    });
  }, [markets, assets, prices]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map(i => <Skeleton key={i} className="h-12 w-full" />)}
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
