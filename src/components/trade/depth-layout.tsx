'use client';

import DepthChart from '@/components/trade/depth-chart';
import OrderBook from '@/components/trade/order-book';
import { useMarketDataStore } from '@/lib/market-data-service';

export function DepthLayout({ marketId }: { marketId: string }) {
  const { bids, asks } = useMarketDataStore((state) => state.depth);

  return (
    <div className="grid h-full grid-cols-12 gap-2">
      <div className="col-span-8">
        <DepthChart bids={bids} asks={asks} />
      </div>
      <div className="col-span-4">
        <OrderBook bids={bids} asks={asks} />
      </div>
    </div>
  );
}
