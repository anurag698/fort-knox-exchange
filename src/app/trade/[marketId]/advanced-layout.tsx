
// This component defines the grid layout for the "Advanced" trading mode.
'use client';

import { LightweightChart } from '@/components/trade/lightweight-chart';
import { OrderBook } from '@/components/trade/order-book';
import { OrderFormAdvanced } from '@/components/trade/order-form-advanced';
import { RecentTrades } from '@/components/trade/recent-trades';
import { Balances } from '@/components/trade/balances';
import { useMarketDataStore } from '@/lib/market-data-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenOrdersPanel } from '@/components/trade/open-orders-panel';
import { TradeHistoryPanel } from '@/components/trade/trade-history-panel';
import { OrderHistoryPanel } from '@/components/trade/order-history-panel';
import { PositionsPanel } from '@/components/trade/positions-panel';


export function AdvancedLayout({ marketId }: { marketId: string }) {
  const { bids, asks } = useMarketDataStore((state) => state.depth);

  return (
    <div className="grid h-full grid-cols-12 grid-rows-12 gap-2">
      <div className="col-span-12 row-span-6 lg:col-span-9">
        <LightweightChart marketId={marketId} />
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3 lg:row-span-12">
        <OrderBook bids={bids} asks={asks} />
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3">
        <OrderFormAdvanced marketId={marketId} />
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3">
        <RecentTrades marketId={marketId} />
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3">
        <div className="flex h-full flex-col gap-2">
          <Balances marketId={marketId} />
        </div>
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-9">
         <Tabs defaultValue="open-orders" className="h-full flex flex-col">
          <TabsList>
            <TabsTrigger value="open-orders">Open Orders</TabsTrigger>
            <TabsTrigger value="order-history">Order History</TabsTrigger>
            <TabsTrigger value="trade-history">Trade History</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
          </TabsList>
          <TabsContent value="open-orders" className="flex-grow">
            <OpenOrdersPanel marketId={marketId} />
          </TabsContent>
          <TabsContent value="order-history" className="flex-grow">
            <OrderHistoryPanel />
          </TabsContent>
          <TabsContent value="trade-history" className="flex-grow">
            <TradeHistoryPanel />
          </TabsContent>
           <TabsContent value="positions" className="flex-grow">
            <PositionsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

