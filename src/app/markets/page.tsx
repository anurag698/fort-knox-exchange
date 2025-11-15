
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, Asset } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketsTable } from '@/components/markets/markets-table';
import { AlertCircle, DatabaseZap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
};

export default function MarketsPage() {
  const firestore = useFirestore();
  const [marketsData, setMarketsData] = useState<Market[] | null>(null);
  const [assetsData, setAssetsData] = useState<Asset[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const marketsQuery = query(collection(firestore, 'markets'), orderBy('id', 'asc'));
        const assetsQuery = query(collection(firestore, 'assets'), orderBy('name', 'asc'));

        const [marketsSnapshot, assetsSnapshot] = await Promise.all([
          getDocs(marketsQuery),
          getDocs(assetsQuery),
        ]);

        const markets = marketsSnapshot.docs.map(doc => ({ ...doc.data() as Market, id: doc.id }));
        const assets = assetsSnapshot.docs.map(doc => ({ ...doc.data() as Asset, id: doc.id }));

        setMarketsData(markets);
        setAssetsData(assets);
      } catch (err) {
        console.error("Markets snapshot error:", err);
        setError(err instanceof Error ? err : new Error("An unknown error occurred while fetching data."));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firestore]);

  const enrichedMarkets: EnrichedMarket[] = useMemo(() => {
    if (!marketsData || !assetsData) {
      return [];
    }
    const assetsMap = new Map(assetsData.map(asset => [asset.id, asset]));
    return marketsData.map(market => ({
      ...market,
      baseAsset: assetsMap.get(market.baseAssetId),
      quoteAsset: assetsMap.get(market.quoteAssetId),
    }));
  }, [marketsData, assetsData]);


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
                Could not fetch market data. Please check your Firestore security rules and network connection.
            </AlertDescription>
        </Alert>
      );
    }
    
    if (enrichedMarkets.length === 0) {
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
