// This component defines the grid layout for the "Chart+TV" trading mode.
'use client';

import LightweightChart from '@/components/trade/lightweight-chart';
import { OrderForm } from '@/components/trade/order-form';
import { useMarketDataStore } from '@/lib/market-data-service';

export function ChartLayout({ marketId }: { marketId: string }) {
  const klineData = useMarketDataStore((state) => state.klines);
  
  return (
    <div className="grid h-full grid-cols-12 gap-2">
      <div className="col-span-9">
        <LightweightChart klineData={klineData} />
      </div>
      <div className="col-span-3">
        <OrderForm marketId={marketId} />
      </div>
    </div>
  );
}
