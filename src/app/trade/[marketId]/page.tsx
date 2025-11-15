'use client';

import { useState } from "react";
import { Balances } from "@/components/trade/balances";
import { TradingViewChart } from "@/components/trade/trading-view-chart";
import { OrderBook } from "@/components/trade/order-book";
import { OrderForm } from "@/components/trade/order-form";
import { UserTrades } from "@/components/trade/user-trades";

export default function MarketTradePage({ params }: { params: { marketId: string } }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);
  const marketId = params.marketId || 'BTC-USDT';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-9 flex flex-col gap-4">
        <TradingViewChart marketId={marketId} />
        <UserTrades marketId={marketId} />
      </div>
      <div className="lg:col-span-3 flex flex-col gap-4">
        <OrderBook marketId={marketId} onPriceSelect={setSelectedPrice} />
        <Balances marketId={marketId} />
        <OrderForm marketId={marketId} selectedPrice={selectedPrice} />
      </div>
    </div>
  );
}
