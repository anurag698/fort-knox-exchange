'use client';

import { useState, useEffect } from 'react';
import type { Market } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketsTable } from '@/components/markets/markets-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CandlestickChart } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    // Only attempt to fetch data if the firestore instance is available.
    if (firestore) {
      const fetchMarkets = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const marketsQuery = query(collection(firestore, 'markets'));
          const querySnapshot = await getDocs(marketsQuery);
          const marketsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // This ensures we have some default values for fields used in MarketsTable
            return {
              id: doc.id,
              baseAssetId: data.baseAssetId,
              quoteAssetId: data.quoteAssetId,
              minOrderSize: data.minOrderSize,
              pricePrecision: data.pricePrecision,
              quantityPrecision: data.quantityPrecision,
              makerFee: data.makerFee,
              takerFee: data.takerFee,
              createdAt: data.createdAt,
              change: 0, // Default value
              volume: 0, // Default value
            } as Market;
          });
          setMarkets(marketsData);
        } catch (err) {
          console.error("Failed to fetch markets:", err);
          setError(err instanceof Error ? err : new Error('An unknown error occurred while fetching markets.'));
        } finally {
          setIsLoading(false);
        }
      };

      fetchMarkets();
    } else {
      // If firestore is not yet available, we are technically still loading.
      setIsLoading(true);
    }
  }, [firestore]); // This effect re-runs when the firestore instance becomes available.

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
