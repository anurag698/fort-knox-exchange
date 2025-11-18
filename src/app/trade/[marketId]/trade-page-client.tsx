
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { MarketHeader } from "@/components/trade/market-header";
import { MemoizedLightweightChart } from "@/components/trade/lightweight-chart";
import { OrderBook } from "@/components/trade/order-book";
import { RecentTrades } from "@/components/trade/recent-trades";
import { OrderForm } from "@/components/trade/order-form";
import { Balances } from "@/components/trade/balances";
import { UserTrades } from "@/components/trade/user-trades";
import { DepthChart } from "@/components/trade/depth-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketDataStore } from "@/hooks/use-market-data-store";
import { marketDataService } from "@/lib/market-data-service";
import { useUser } from "@/firebase";

export default function TradePageClient({ marketId }: { marketId: string }) {
  const { user } = useUser();
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>();
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const setDepth = useMarketDataStore(state => state.setDepth);
  const addTrade = useMarketDataStore(state => state.addTrade);
  const updateTicker = useMarketDataStore(state => state.updateTicker);
  const setConnectionStatus = useMarketDataStore(state => state.setConnectionStatus);
  const bids = useMarketDataStore(state => state.bids);
  const asks = useMarketDataStore(state => state.asks);

  const symbol = useMemo(() => marketId.replace("-", "").toLowerCase(), [marketId]);

  useEffect(() => {
    // Reset state when marketId changes
    setDepth([], []);
    
    const depthService = marketDataService.subscribe(
      `${symbol}@depth`,
      (data: any) => setDepth(data.b, data.a),
      () => setConnectionStatus(true),
      (error: string) => setConnectionStatus(false, error)
    );

    const tradeService = marketDataService.subscribe(
      `${symbol}@trade`,
      (data: any) => addTrade(data)
    );
    
    const tickerService = marketDataService.subscribe(
      `${symbol}@ticker`,
      (data: any) => {
        updateTicker(symbol, {
          price: parseFloat(data.c),
          priceChangePercent: parseFloat(data.P),
          high: parseFloat(data.h),
          low: parseFloat(data.l),
          volume: parseFloat(data.v),
          quoteVolume: parseFloat(data.q),
          eventTime: data.E,
        });
      }
    );

    return () => {
      depthService.close();
      tradeService.close();
      tickerService.close();
      setConnectionStatus(false);
    };
  }, [symbol, setDepth, addTrade, updateTicker, setConnectionStatus]);

  const handlePriceSelect = useCallback((price: number) => {
    setSelectedPrice(price);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <MarketHeader marketId={marketId} />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-4 grid grid-cols-5 gap-4">
            <div className="col-span-5 lg:col-span-4">
                 <div className="h-[550px] bg-card rounded-lg border">
                    <MemoizedLightweightChart marketId={marketId} setIsChartFullscreen={setIsChartFullscreen} />
                </div>
            </div>
            <div className="col-span-5 lg:col-span-1 flex flex-col gap-4">
                <OrderBook marketId={marketId} onPriceSelect={handlePriceSelect} height={550} />
            </div>
             <div className="col-span-5">
                <Tabs defaultValue="orders">
                    <TabsList>
                        <TabsTrigger value="orders">Open Orders</TabsTrigger>
                        <TabsTrigger value="history">Trade History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="orders">
                        <UserTrades marketId={marketId} />
                    </TabsContent>
                    <TabsContent value="history">
                        {/* Placeholder for trade history component */}
                        <div className="text-center py-12 text-muted-foreground">Trade history coming soon.</div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4">
            <Balances marketId={marketId} />
            <OrderForm marketId={marketId} selectedPrice={selectedPrice} />
        </div>
      </div>
    </div>
  );
}
