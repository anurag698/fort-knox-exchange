
'use client';

import { useMarkets } from '@/hooks/use-markets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketsTable } from '@/components/markets/markets-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CandlestickChart } from 'lucide-react';

export default function MarketsPage() {
  const { data: markets, isLoading, error } = useMarkets();

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
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load market data. Please try again later.
              </AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && markets && markets.length > 0 && (
            <MarketsTable markets={markets} />
          )}
          {!isLoading && !error && (!markets || markets.length === 0) && (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <CandlestickChart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Markets Found</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                There are currently no markets available to trade. New markets will appear here once added by an administrator.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
