'use client';

import { useState, use } from "react";
import { Balances } from "@/components/trade/balances";
import { MemoizedTradingViewChart } from "@/components/trade/trading-view-chart";
import { OrderBook } from "@/components/trade/order-book";
import { OrderForm } from "@/components/trade/order-form";
import { UserTrades } from "@/components/trade/user-trades";

export default function MarketTradePage({ params }: { params: Promise<{ marketId: string }> }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);
  const { marketId } = use(params);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-9 flex flex-col gap-4">
        <MemoizedTradingViewChart marketId={marketId} />
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
