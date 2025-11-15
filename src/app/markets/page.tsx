
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, Asset, MarketData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketsTable } from '@/components/markets/markets-table';
import { AlertCircle, DatabaseZap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { MarketStatCard } from '@/components/markets/market-stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  marketData?: MarketData;
};

export default function MarketsPage() {
  const firestore = useFirestore();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
            getDocs(assetsQuery)
        ]);

        const marketsData = marketsSnapshot.docs.map(doc => ({ ...doc.data() as Market, id: doc.id }));
        const assetsData = assetsSnapshot.docs.map(doc => ({ ...doc.data() as Asset, id: doc.id }));

        setMarkets(marketsData);
        setAssets(assetsData);
        
        const marketDataQuery = query(collection(firestore, 'market_data'));
        const unsubscribe = onSnapshot(marketDataQuery, (snapshot) => {
            const liveData: Record<string, MarketData> = {};
            snapshot.forEach(doc => {
                liveData[doc.id] = { ...doc.data() as MarketData, id: doc.id };
            });
            setMarketData(liveData);
            setIsLoading(false);
        }, (err) => {
            console.error("Market live data subscription error:", err);
            setIsLoading(false);
        });

        return unsubscribe;

      } catch (err: any) {
        console.error("Error fetching initial market data:", err);
        setError(err);
        setIsLoading(false);
      }
    };

    const unsubscribePromise = fetchData();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [firestore]);

  const enrichedMarkets: EnrichedMarket[] = useMemo(() => {
    if (!markets.length || !assets.length) {
      return [];
    }
    const assetsMap = new Map(assets.map(asset => [asset.id, asset]));

    return markets.map(market => ({
      ...market,
      baseAsset: assetsMap.get(market.baseAssetId),
      quoteAsset: assetsMap.get(market.quoteAssetId),
      marketData: marketData[market.id],
    }));
  }, [markets, assets, marketData]);

  const usdtMarkets = useMemo(() => enrichedMarkets.filter(m => m.quoteAssetId === 'USDT'), [enrichedMarkets]);

  const topGainers = useMemo(() => {
    return [...usdtMarkets]
      .filter(m => m.marketData?.priceChangePercent)
      .sort((a, b) => (b.marketData?.priceChangePercent || 0) - (a.marketData?.priceChangePercent || 0))
      .slice(0, 4);
  }, [usdtMarkets]);

  const topVolume = useMemo(() => {
    return [...usdtMarkets]
      .filter(m => m.marketData?.volume)
      .sort((a, b) => (b.marketData?.volume || 0) - (a.marketData?.volume || 0))
      .slice(0, 4);
  }, [usdtMarkets]);

  const hotList = useMemo(() => {
    // Simple "hot" logic: a mix of high volume and high change
    return [...usdtMarkets]
       .filter(m => m.marketData?.volume && m.marketData?.priceChangePercent)
       .sort((a, b) => ((b.marketData?.volume || 0) * Math.abs(b.marketData?.priceChangePercent || 0)) - ((a.marketData?.volume || 0) * Math.abs(a.marketData?.priceChangePercent || 0)))
       .slice(0, 4);
  }, [usdtMarkets]);

  const newTokens = useMemo(() => {
    // Simple "new" logic: sort by creation date if available
     return [...usdtMarkets]
       .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
       .slice(0, 4);
  }, [usdtMarkets]);


  const renderContent = () => {
    if (isLoading) {
      return (
         <div className="rounded-md border">
            <div className="p-4">
              <Skeleton className="h-10 w-full" />
            </div>
            {[...Array(10)].map((_, i) => (
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
            <AlertTitle>Error Loading Markets</AlertTitle>
            <AlertDescription>
                {error.message || "Could not fetch market data. Please ensure your Firestore security rules allow list access for the 'markets' and 'assets' collections and try again."}
            </AlertDescription>
        </Alert>
      );
    }
    
    if (!isLoading && (!markets || markets.length === 0)) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <DatabaseZap className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Database Not Seeded</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
                The exchange requires initial data for assets and markets. Please go to the Update Data page to seed the database.
            </p>
            <Button asChild>
                <Link href="/seed-data">Go to Update Data Page</Link>
            </Button>
        </div>
      );
    }

    return <MarketsTable markets={usdtMarkets} />;
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

       <Tabs defaultValue="overview">
        <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">All Tokens</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MarketStatCard title="Hot" markets={hotList} isLoading={isLoading} />
              <MarketStatCard title="Top Gainer" markets={topGainers} isLoading={isLoading} />
              <MarketStatCard title="Top Volume" markets={topVolume} isLoading={isLoading} />
              <MarketStatCard title="New" markets={newTokens} isLoading={isLoading} />
            </div>
        </TabsContent>
         <TabsContent value="data" className="mt-6">
            <Card>
                <CardHeader>
                <CardTitle>Top Tokens by Market Capitalization</CardTitle>
                <CardDescription>
                    Get a comprehensive snapshot of all cryptocurrencies available on Fort Knox Exchange.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </TabsContent>
       </Tabs>
    </div>
  );
}



    