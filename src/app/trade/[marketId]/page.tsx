'use client';

import { useState } from "react";
import { Balances } from "@/components/trade/balances";
import { MemoizedTradingViewChart } from "@/components/trade/trading-view-chart";
import { OrderBook } from "@/components/trade/order-book";
import { OrderForm } from "@/components/trade/order-form";
import { UserTrades } from "@/components/trade/user-trades";

export default function MarketTradePage({ params }: { params: { marketId: string } }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-9 flex flex-col gap-4">
        <MemoizedTradingViewChart marketId={params.marketId || 'BTC-USDT'} />
        <UserTrades marketId={params.marketId || 'BTC-USDT'} />
      </div>
      <div className="lg:col-span-3 flex flex-col gap-4">
        <OrderBook marketId={params.marketId || 'BTC-USDT'} onPriceSelect={setSelectedPrice} />
        <Balances marketId={params.marketId || 'BTC-USDT'} />
        <OrderForm marketId={params.marketId || 'BTC-USDT'} selectedPrice={selectedPrice} />
      </div>
    </div>
  );
}
