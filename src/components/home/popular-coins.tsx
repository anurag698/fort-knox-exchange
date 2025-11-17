
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
import type { Market } from "@/lib/types";

// Mock icons for coins
const coinIcons: { [key: string]: React.ElementType } = {
  BTC: Bitcoin,
  ETH: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 12 6-9 6 9-6 9Z"/><path d="M6 12h12"/></svg>,
  SOL: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M18.36 18.36 5.64 5.64"/><path d="m18.36 5.64-12.72 12.72"/></svg>,
  ADA: Circle,
  MATIC: Circle,
  DOGE: Circle,
  DEFAULT: Info,
};

export function PopularCoins() {
  const { data: markets, isLoading: marketsLoading, error } = useMarkets();
  
  const [prices, setPrices] = useState<Record<string, { price: number, change: number }>>({});
  const [pricesLoading, setPricesLoading] = useState(true);

  const displayMarkets = useMemo(() => {
    if (!markets) return [];
    return markets.filter(m => m.quoteAssetId === 'USDT').slice(0, 5); 
  }, [markets]);

  useEffect(() => {
    if (displayMarkets.length === 0) {
      setPricesLoading(false);
      return;
    }

    const streams = displayMarkets.map(m => `${m.baseAssetId.toLowerCase()}usdt@ticker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onopen = () => {
        setPricesLoading(false);
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // The combined stream wraps the payload in a `data` object and includes the stream name
        if (message.data) {
            const { s: symbol, c: price, P: change } = message.data;
            if (symbol && price && change) {
                setPrices(prevPrices => ({
                    ...prevPrices,
                    [symbol.replace('USDT', '')]: {
                        price: parseFloat(price),
                        change: parseFloat(change),
                    }
                }));
            }
        }
    };
    
    ws.onerror = (err) => {
        console.error("PopularCoins WebSocket error:", err);
        setPricesLoading(false);
    }

    return () => {
      ws.close();
    };
  }, [displayMarkets]);


  const isLoading = marketsLoading || pricesLoading;

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
          const priceData = prices[market.baseAssetId];
          const price = priceData?.price ?? 0;
          const change = priceData?.change ?? 0;
          const isPositive = change >= 0;
          const Icon = coinIcons[market.baseAssetId] || coinIcons.DEFAULT;

          return (
            <li key={market.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
              <div className="flex items-center gap-3">
                 <Icon className="h-6 w-6" />
                 <div className="font-semibold">{market.baseAssetId}</div>
                 <div className="text-muted-foreground">{market.baseAssetId}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={cn("text-sm", isPositive ? 'text-green-500' : 'text-red-500')}>
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
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
