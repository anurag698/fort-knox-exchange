'use client';

import CanvasDepthChart from '@/components/trade/canvas-depth-chart';
import OrderBook from '@/components/trade/order-book';
import { useMarketDataStore } from '@/lib/market-data-service';

export function DepthLayout({ marketId }: { marketId: string }) {
  const { bids, asks } = useMarketDataStore((state) => state.depth);

  return (
    <div className="grid h-full grid-cols-12 gap-2">
      <div className="col-span-8">
        <CanvasDepthChart marketId={marketId} />
      </div>
      <div className="col-span-4">
        <OrderBook />
      </div>
    </div>
  );
}
