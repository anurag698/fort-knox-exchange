'use client';

import { useState } from "react";
import { Balances } from "@/components/trade/balances";
import { Charting } from "@/components/trade/charting";
import { OrderBook } from "@/components/trade/order-book";
import { OrderForm } from "@/components/trade/order-form";
import { UserTrades } from "@/components/trade/user-trades";

export default function TradePage() {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-4 flex flex-col gap-4">
        <Charting />
        <UserTrades />
      </div>
      <div className="lg:col-span-1 flex flex-col gap-4">
        <OrderBook onPriceSelect={setSelectedPrice} />
        <Balances />
        <OrderForm selectedPrice={selectedPrice} />
      </div>
    </div>
  );
}
