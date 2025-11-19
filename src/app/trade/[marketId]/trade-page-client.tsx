// src/app/trade/[marketId]/trade-page-client.tsx
"use client";

import React, { useEffect } from "react";
import TradingChartContainer from "@/components/trade/trading-chart-container";
import OrderbookPanel from "@/components/trade/orderbook/orderbook-panel";
import OrderForm from "@/components/trade/orderform/order-form";
import marketDataService from "@/services/market-data-service";

export default function TradePageClient({ params }: { params: { marketId: string } }) {
  const marketId = params?.marketId ?? "BTC-USDT";
  const symbol = marketId.replace("-", "").toUpperCase();

  useEffect(() => {
    marketDataService.startFeed(symbol, "1m");
    return () => {
      // leave feed running globally or stop here if desired
      // marketDataService.stopFeed();
    };
  }, [symbol]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>
      <div>
        <TradingChartContainer marketId={marketId} />
      </div>
      <aside>
        <OrderbookPanel />
        <OrderForm marketId={marketId} />
      </aside>
    </div>
  );
}
