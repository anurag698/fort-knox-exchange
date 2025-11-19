// src/components/trade/trading-chart-container.tsx
"use client";

import React, { useCallback } from "react";
import ChartEngineComponent from "./chart/chart-engine";
import marketDataService from "@/services/market-data-service";
import { useMarketDataStore } from "@/state/market-data-store";

export default function TradingChartContainer({ marketId }: { marketId?: string }) {
  const symbolFromStore = useMarketDataStore((s) => s.symbol);
  const symbol = (marketId ?? symbolFromStore ?? "BTC-USDT").replace("-", "").toUpperCase();

  React.useEffect(() => {
    marketDataService.startFeed(symbol, "1m");
    return () => {
      // keep feed alive globally unless you want to stop:
      // marketDataService.stopFeed();
    };
  }, [symbol]);

  const onEngineReady = useCallback((ctx: any) => {
    // optionally expose for debug
    (window as any).__FK_CHART__ = { engine: ctx.engine, chart: ctx.chart, overlays: ctx.overlays };
  }, []);

  return (
    <div style={{ width: "100%", height: 620 }}>
      <ChartEngineComponent symbol={symbol} interval="1m" onEngineReady={onEngineReady} />
    </div>
  );
}
