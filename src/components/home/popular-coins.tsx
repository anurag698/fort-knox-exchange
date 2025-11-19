
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Bitcoin, Info, Circle, ArrowRight } from "lucide-react";
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useMarkets } from '@/hooks/use-markets';
import { useMarketDataStore } from '@/state/market-data-store';
import { marketDataService } from '@/services/market-data-service';


// Mock icons for coins
const coinIcons: { [key: string]: React.ElementType } = {
  BTC: Bitcoin,
  ETH: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 12 6-9 6 9-6 9Z"/><path d="M6 12h12"/></svg>,
  SOL: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0_0_24_24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M18.36 18.36 5.64 5.64"/><path d="m18.36 5.64-12.72 12.72"/></svg>,
  ADA: Circle,
  MATIC: Circle,
  DOGE: Circle,
  DEFAULT: Info,
};

export function PopularCoins() {
  const { data: markets, isLoading: marketsLoading, error } = useMarkets();
  const ticker = useMarketDataStore(state => state.ticker);

  const displayMarkets = useMemo(() => {
    if (!markets) return [];
    return markets.filter(m => m.quoteAssetId === 'USDT').slice(0, 5); 
  }, [markets]);
  
  const isLoading = marketsLoading || !markets || markets.length === 0;

  useEffect(() => {
    if (!displayMarkets || displayMarkets.length === 0) return;

    const symbol = displayMarkets[0].id;

    // NEW API (Part 13.7-C upgraded architecture)
    marketDataService.startFeed(symbol);

    return () => {
        marketDataService.stopFeed();
    };
  }, [displayMarkets]);


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-6 pt-0">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Could not load market data.
                </AlertDescription>
            </Alert>
        )
    }

    if (!markets || markets.length === 0) {
      return (
         <div className="text-center py-8 text-muted-foreground">
            <p>No popular coins to display.</p>
         </div>
      );
    }

    return (
      <ul className="space-y-1">
        {displayMarkets.map(market => {
          // Use the single ticker from the store, but only if it matches the market we are displaying
          const marketSymbol = market.id.replace('-', '');
          const tickerData = (ticker && ticker.s === marketSymbol) ? ticker : null;

          const price = tickerData?.c ?? 0;
          const change = tickerData?.P ?? 0;
          const isPositive = parseFloat(String(change)) >= 0;
          const Icon = coinIcons[market.baseAssetId] || coinIcons.DEFAULT;

          return (
            <li key={market.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
              <div className="flex items-center gap-3">
                 <Icon className="h-6 w-6" />
                 <div className="font-semibold">{market.baseAssetId}</div>
                 <div className="text-muted-foreground">{market.baseAssetId}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium">${parseFloat(String(price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={cn("text-sm", isPositive ? 'text-green-500' : 'text-red-500')}>
                  {isPositive ? '+' : ''}{parseFloat(String(change)).toFixed(2)}%
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
            <CardTitle className="text-lg">Popular</CardTitle>
            <CardDescription className="text-lg text-muted-foreground hover:text-foreground cursor-pointer">New Listing</CardDescription>
        </div>
        <Button variant="link" size="sm" asChild>
            <Link href="/markets">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
        </Button>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
