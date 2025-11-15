'use client';

import { useState, useEffect } from "react";
import { Balances } from "@/components/trade/balances";
import { Charting } from "@/components/trade/charting";
import { OrderBook } from "@/components/trade/order-book";
import { OrderForm } from "@/components/trade/order-form";
import { UserTrades } from "@/components/trade/user-trades";

export default function MarketTradePage({ params: { marketId: routeMarketId } }: { params: { marketId: string } }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);
  const [marketId, setMarketId] = useState<string>(routeMarketId || 'BTC-USDT');

  useEffect(() => {
    setMarketId(routeMarketId || 'BTC-USDT');
  }, [routeMarketId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-4 flex flex-col gap-4">
        <Charting marketId={marketId} setMarketId={setMarketId} />
        <UserTrades marketId={marketId} />
      </div>
      <div className="lg:col-span-1 flex flex-col gap-4">
        <OrderBook marketId={marketId} onPriceSelect={setSelectedPrice} />
        <Balances marketId={marketId} />
        <OrderForm marketId={marketId} selectedPrice={selectedPrice} />
      </div>
    </div>
  );
}
