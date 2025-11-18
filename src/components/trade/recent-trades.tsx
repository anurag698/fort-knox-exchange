// This component displays a feed of the most recent trades for the market.
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { useMarkets } from '@/hooks/use-markets';
import { useMarketDataStore } from '@/hooks/use-market-data-store';

export function RecentTrades({ marketId }: { marketId: string }) {
  const { data: markets } = useMarkets();
  const trades = useMarketDataStore(state => state.trades);
  const isLoading = useMarketDataStore(state => !state.isConnected && state.trades.length === 0);
  const error = useMarketDataStore(state => state.error);

  const market = markets?.find(m => m.id === marketId);
  const pricePrecision = market?.pricePrecision ?? 2;
  const quantityPrecision = market?.quantityPrecision ?? 4;

  const renderContent = () => {
    if (isLoading) {
      return <div className="space-y-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>;
    }

    if (error) {
      return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }
    
    return (
       <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
            <span>Price</span>
            <span>Amount</span>
            <span>Time</span>
        </div>
        {trades.map((trade, index) => (
          <div key={trade.t + '-' + index} className="flex justify-between text-xs font-mono p-0.5">
            <span className={cn(trade.m ? "text-green-500" : "text-red-500")}>{parseFloat(trade.p).toFixed(pricePrecision)}</span>
            <span>{parseFloat(trade.q).toFixed(quantityPrecision)}</span>
            <span className="text-muted-foreground">{new Date(trade.T).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4"><CardTitle className="text-lg">Recent Trades</CardTitle></CardHeader>
      <CardContent className="p-4 pt-0 flex-grow overflow-y-auto">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
