"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { useMarkets } from '@/hooks/use-markets';

type Trade = {
  p: string; // price
  q: string; // quantity
  m: boolean; // is buyer maker
  T: number; // timestamp
};

export function RecentTrades({ marketId }: { marketId: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: markets } = useMarkets();

  const market = markets?.find(m => m.id === marketId);
  const pricePrecision = market?.pricePrecision ?? 2;
  const quantityPrecision = market?.quantityPrecision ?? 4;


  useEffect(() => {
    if (!marketId) {
      setIsLoading(false);
      setError(new Error("Market ID is not specified."));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setTrades([]);

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${marketId.replace('-', '').toLowerCase()}@trade`);

    ws.onopen = () => {
      setIsLoading(false);
    };

    ws.onmessage = (event) => {
      const newTrade: Trade = JSON.parse(event.data);
      setTrades(prevTrades => [newTrade, ...prevTrades.slice(0, 24)]);
    };

    ws.onerror = (event) => {
      setError(new Error('Failed to connect to the recent trades feed.'));
      setIsLoading(false);
    };

    ws.onclose = () => {
      // Optional: reconnection logic
    };

    return () => {
      ws.close();
    };
  }, [marketId]);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      );
    }

    if (error) {
       return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
              {error.message}
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
       <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
            <span>Price</span>
            <span>Amount</span>
            <span>Time</span>
        </div>
        {trades.map((trade, index) => (
          <div 
            key={trade.T + '-' + index} 
            className="flex justify-between text-xs font-mono p-0.5"
          >
            <span className={cn(trade.m ? "text-green-500" : "text-red-500")}>
              {parseFloat(trade.p).toFixed(pricePrecision)}
            </span>
            <span>{parseFloat(trade.q).toFixed(quantityPrecision)}</span>
            <span className="text-muted-foreground">{new Date(trade.T).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 h-96 overflow-y-auto">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
