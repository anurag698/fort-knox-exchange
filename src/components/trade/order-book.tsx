"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrderBook, type ProcessedOrder } from "@/hooks/use-order-book";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface OrderBookProps {
  onPriceSelect: (price: number) => void;
  marketId: string;
}

export function OrderBook({ onPriceSelect, marketId }: OrderBookProps) {
  const { bids, asks, isLoading, error } = useOrderBook(marketId);
  const [baseAsset, quoteAsset] = marketId.split('-');

  const renderOrderList = (orders: ProcessedOrder[], isBid: boolean) => {
    if (orders.length === 0) {
      return (
        <div className="text-center text-xs text-muted-foreground py-4">
          No {isBid ? 'bids' : 'asks'}
        </div>
      )
    }

    // Determine the max total for visualization
    const maxTotal = Math.max(...orders.map(o => o.total), 0);

    return (
      <div className="space-y-1">
        {orders.slice(0, 7).map((order, index) => (
          <div 
            key={index} 
            className="flex justify-between text-xs font-mono relative cursor-pointer hover:bg-muted/50 p-0.5"
            onClick={() => onPriceSelect(order.price)}
          >
            <div 
              className={`absolute top-0 right-0 h-full ${isBid ? 'bg-green-500/10' : 'bg-red-500/10'}`} 
              style={{ width: `${(order.total / maxTotal) * 100}%`}}
            />
            <span className={`z-10 ${isBid ? "text-green-500" : "text-red-500"}`}>{order.price.toFixed(2)}</span>
            <span className="z-10">{order.quantity.toFixed(4)}</span>
            <span className="z-10">{order.total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (error) {
       return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
              Failed to load order book.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
            <span>Price ({quoteAsset})</span>
            <span>Amount ({baseAsset})</span>
            <span>Total</span>
          </div>
          {renderOrderList(asks.reverse(), false)}
        </div>

        <div className="py-2 text-center text-lg font-bold">
            {bids[0]?.price.toFixed(2) ?? '---'}
        </div>

        <div>
          {renderOrderList(bids, true)}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Order Book</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
