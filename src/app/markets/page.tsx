
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, Asset, MarketData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketsTable } from '@/components/markets/markets-table';
import { AlertCircle, DatabaseZap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';

export type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  marketData?: MarketData;
};

export default function MarketsPage() {
  const firestore = useFirestore();
  
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [marketData, setMarketData] = useState<MarketData[] | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      return;
    }

    const fetchStaticData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const marketsQuery = query(collection(firestore, 'markets'), orderBy('id', 'asc'));
        const assetsQuery = query(collection(firestore, 'assets'), orderBy('name', 'asc'));

        const [marketsSnapshot, assetsSnapshot] = await Promise.all([
          getDocs(marketsQuery),
          getDocs(assetsQuery),
        ]);

        const marketsList = marketsSnapshot.docs.map(doc => ({ ...doc.data() as Market, id: doc.id }));
        const assetsList = assetsSnapshot.docs.map(doc => ({ ...doc.data() as Asset, id: doc.id }));
        
        setMarkets(marketsList);
        setAssets(assetsList);
        
        // Only set up the live listener after static data is successfully fetched
        const marketDataQuery = query(collection(firestore, 'market_data'), orderBy('id', 'asc'));
        const unsubscribe = onSnapshot(marketDataQuery, (snapshot) => {
            const liveData = snapshot.docs.map(doc => ({...doc.data() as MarketData, id: doc.id}));
            setMarketData(liveData);
        }, (err) => {
            console.error("Market live data subscription error:", err);
            // Non-blocking error for live data
        });

        return unsubscribe;

      } catch (err) {
        console.error("Markets static data fetch error:", err);
        setError(err instanceof Error ? err : new Error("An unknown error occurred while fetching data. Check security rules."));
      } finally {
        setIsLoading(false);
      }
    };

    let unsubscribe: (() => void) | undefined;
    fetchStaticData().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [firestore]);

  const enrichedMarkets: EnrichedMarket[] = useMemo(() => {
    if (!markets || !assets) {
      return [];
    }
    const assetsMap = new Map(assets.map(asset => [asset.id, asset]));
    const marketDataMap = new Map(marketData?.map(md => [md.id, md]));

    return markets.map(market => ({
      ...market,
      baseAsset: assetsMap.get(market.baseAssetId),
      quoteAsset: assetsMap.get(market.quoteAssetId),
      marketData: marketDataMap.get(market.id),
    }));
  }, [markets, assets, marketData]);


  const renderContent = () => {
    if (isLoading) {
      return (
         <div className="rounded-md border">
            <div className="p-4">
              <Skeleton className="h-10 w-full" />
            </div>
            {[...Array(4)].map((_, i) => (
                <div className="border-t p-4" key={i}>
                    <Skeleton className="h-8 w-full" />
                </div>
            ))}
          </div>
      );
    }

    if (error) {
       return (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Markets</AlertTitle>
            <AlertDescription>
                {error.message || "Could not fetch market data. Please ensure your Firestore security rules allow list access for the 'markets' and 'assets' collections and try again."}
            </AlertDescription>
        </Alert>
      );
    }
    
    if (!isLoading && markets?.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <DatabaseZap className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Database Not Seeded</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
                The exchange requires initial data for assets and markets. Please seed the database to continue.
            </p>
            <Button asChild>
                <Link href="/seed-data">Seed The Exchange</Link>
            </Button>
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
