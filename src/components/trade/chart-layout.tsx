// This component defines the grid layout for the "Chart+TV" trading mode.
'use client';

import { MemoizedLightweightChart } from '@/components/trade/lightweight-chart';
import { OrderForm } from '@/components/trade/order-form';

export function ChartLayout({ marketId }: { marketId: string }) {
  return (
    <div className="grid h-full grid-cols-12 gap-2">
      <div className="col-span-9">
        <MemoizedLightweightChart marketId={marketId} />
      </div>
      <div className="col-span-3">
        <OrderForm marketId={marketId} />
      </div>
    </div>
  );
}
