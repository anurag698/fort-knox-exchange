'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { useMarkets } from '@/hooks/use-markets';
import { useMarketDataStore } from '@/lib/market-data-service';
import { useEffect, useRef, useState } from 'react';

export function RecentTrades({ marketId }: { marketId: string }) {
  const { data: markets } = useMarkets();
  const trades = useMarketDataStore(state => state.trades);
  const isLoading = useMarketDataStore(state => !state.isConnected && state.trades.length === 0);
  const error = useMarketDataStore(state => state.error);

  const tradesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const market = markets?.find(m => m.id === marketId);
  const pricePrecision = market?.pricePrecision ?? 2;
  const quantityPrecision = market?.quantityPrecision ?? 4;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Check if user is near the bottom, with a small tolerance
    const atBottom = scrollTop + clientHeight >= scrollHeight - 20;
    if (atBottom !== autoScroll) {
      setAutoScroll(atBottom);
    }
  };

  useEffect(() => {
    if (autoScroll) {
      tradesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [trades, autoScroll]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="space-y-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>;
    }

    if (error) {
      return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }
    
    return (
       <div className="h-full flex flex-col">
        <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
            <span>Price</span>
            <span>Amount</span>
            <span>Time</span>
        </div>
        <div className="flex-grow overflow-y-auto" onScroll={handleScroll}>
            <div className="space-y-1">
                {trades.map((trade, index) => (
                <div key={trade.t + '-' + index} className="flex justify-between text-xs font-mono p-0.5">
                    <span className={cn(trade.m ? "text-green-500" : "text-red-500")}>{parseFloat(trade.p).toFixed(pricePrecision)}</span>
                    <span>{parseFloat(trade.q).toFixed(quantityPrecision)}</span>
                    <span className="text-muted-foreground">{new Date(trade.T).toLocaleTimeString()}</span>
                </div>
                ))}
            </div>
            <div ref={tradesEndRef} />
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4"><CardTitle className="text-lg">Recent Trades</CardTitle></CardHeader>
      <CardContent className="p-4 pt-0 flex-grow overflow-hidden">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
