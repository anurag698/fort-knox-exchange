'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { useMarkets } from '@/hooks/use-markets';
import { useMarketDataStore } from '@/lib/market-data-service';
import { useEffect, useRef } from 'react';

export function RecentTrades({ marketId }: { marketId: string }) {
  const { data: markets } = useMarkets();
  const trades = useMarketDataStore(state => state.trades);
  const isLoading = useMarketDataStore(state => !state.isConnected && state.trades.length === 0);
  const error = useMarketDataStore(state => state.error);

  const listRef = useRef<HTMLDivElement>(null);

  const market = markets?.find(m => m.id === marketId);
  const pricePrecision = market?.pricePrecision ?? 2;
  const quantityPrecision = market?.quantityPrecision ?? 4;

  useEffect(() => {
    if (!listRef.current) return;

    const node = listRef.current;
    // Check if user is near the bottom before auto-scrolling
    const isAtBottom = Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop) < 20;

    if (isAtBottom) {
      // Directly set scrollTop for more reliable scrolling within the container
      node.scrollTop = node.scrollHeight;
    }
  }, [trades]);


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
        <div 
          ref={listRef} 
          className="flex-grow overflow-y-auto" 
          style={{overflowAnchor: "none"}}
        >
            <div className="space-y-1">
                {trades.map((trade, index) => (
                <div key={trade.t + '-' + index} className="flex justify-between text-xs font-mono p-0.5">
                    <span className={cn(trade.m ? "text-green-500" : "text-red-500")}>{parseFloat(trade.p).toFixed(pricePrecision)}</span>
                    <span>{parseFloat(trade.q).toFixed(quantityPrecision)}</span>
                    <span className="text-muted-foreground">{new Date(trade.T).toLocaleTimeString()}</span>
                </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-panel h-full flex flex-col">
      <div className="trading-panel-header">Recent Trades</div>
      <div className="trading-panel-body flex-grow overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
