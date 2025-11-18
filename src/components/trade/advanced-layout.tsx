// This component defines the grid layout for the "Advanced" trading mode.
'use client';

import { MemoizedLightweightChart } from '@/components/trade/lightweight-chart';
import { OrderBook } from '@/components/trade/order-book';
import { OrderForm } from '@/components/trade/order-form';
import { RecentTrades } from '@/components/trade/recent-trades';
import { Balances } from '@/components/trade/balances';
import { UserTrades } from '@/components/trade/user-trades';

export function AdvancedLayout({ marketId }: { marketId: string }) {
  return (
    <div className="grid h-full grid-cols-12 grid-rows-12 gap-2">
      <div className="col-span-12 row-span-6 lg:col-span-9">
        <MemoizedLightweightChart marketId={marketId} />
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3 lg:row-span-12">
        <OrderBook marketId={marketId} onPriceSelect={() => {}} />
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3">
        <OrderForm marketId={marketId} />
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
    </div>
  );
}
