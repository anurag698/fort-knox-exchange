// This component defines the grid layout for the "Advanced" trading mode.
'use client';

import { LightweightChart } from '@/components/trade/lightweight-chart';
import { OrderBook } from '@/components/trade/order-book';
import { OrderFormAdvanced } from '@/components/trade/order-form-advanced';
import { RecentTrades } from '@/components/trade/recent-trades';
import { Balances } from '@/components/trade/balances';
import { UserTrades } from '@/components/trade/user-trades';
import { useMarketDataStore } from '@/lib/market-data-service';
import { OrderHistoryPanel } from '@/components/trade/order-history-panel';

export function AdvancedLayout({ marketId }: { marketId: string }) {
  const klineData = useMarketDataStore((state) => state.klines);
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
          <div className="flex-grow">
            <UserTrades marketId={marketId} />
          </div>
        </div>
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-9">
        <OrderHistoryPanel />
      </div>
    </div>
  );
}
