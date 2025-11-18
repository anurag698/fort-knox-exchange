
'use client';

import { OrderFormAdvanced } from '@/components/trade/order-form-advanced';
import { MultiChartProvider } from './multi-chart-provider';
import { ChartLayoutToggle } from './chart-layout-toggle';
import { MultiChartLayout } from './multi-chart-layout';

export function ChartLayout({ marketId }: { marketId: string }) {
  return (
    <div className="grid h-full grid-cols-12 gap-2">
      <div className="col-span-9 flex flex-col h-full">
        <MultiChartProvider marketId={marketId}>
            <ChartLayoutToggle />
            <div className="flex-grow">
                <MultiChartLayout />
            </div>
        </MultiChartProvider>
      </div>
      <div className="col-span-3">
        <OrderFormAdvanced marketId={marketId} />
      </div>
    </div>
  );
}
