
'use client';

import { useState } from 'react';
import { Balances } from '@/components/trade/balances';
import { MemoizedTradingViewChart } from '@/components/trade/trading-view-chart';
import { OrderBook } from '@/components/trade/order-book';
import { OrderForm } from '@/components/trade/order-form';
import { UserTrades } from '@/components/trade/user-trades';
import { RecentTrades } from '@/components/trade/recent-trades';

export default function TradePageClient({ marketId }: { marketId: string }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(
    undefined
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      <div className="xl:col-span-3 flex flex-col gap-4 order-2 xl:order-1">
        <OrderBook marketId={marketId} onPriceSelect={setSelectedPrice} />
      </div>

      <div className="xl:col-span-6 flex flex-col gap-4 order-1 xl:order-2">
        <MemoizedTradingViewChart marketId={marketId} />
        <OrderForm marketId={marketId} selectedPrice={selectedPrice} />
      </div>

      <div className="xl:col-span-3 flex flex-col gap-4 order-3 xl:order-3">
        <Balances marketId={marketId} />
        <RecentTrades marketId={marketId} />
      </div>

      <div className="xl:col-span-12 order-4">
        <UserTrades marketId={marketId} />
      </div>
    </div>
  );
}
