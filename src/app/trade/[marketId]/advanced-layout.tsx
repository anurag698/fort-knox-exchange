// src/app/trade/[marketId]/advanced-layout.tsx
"use client";

import React from "react";
import MarketsSidebar from "@/components/trade/markets/markets-sidebar";
import TradingChartContainer from "@/components/trade/trading-chart-container";
import OrderbookPanel from "@/components/trade/orderbook/orderbook-panel";
import OrderForm from "@/components/trade/orderform/order-form";

export default function AdvancedLayout({ params }: { params: { marketId: string } }) {
  const marketId = params?.marketId ?? "BTC-USDT";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 360px", gap: 12 }}>
      <MarketsSidebar />
      <div>
        <TradingChartContainer marketId={marketId} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <OrderbookPanel />
        <OrderForm marketId={marketId} />
      </div>
    </div>
  );
}
