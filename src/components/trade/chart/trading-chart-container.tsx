
// src/components/trade/chart/trading-chart-container.tsx
"use client";

import React, { useCallback, useRef } from "react";
import ChartEngineComponent from "@/components/trade/chart/chart-engine";
import { useMarketDataStore } from "@/state/market-data-store";
import marketDataService from "@/services/market-data-service";

export default function TradingChartContainer({ marketId }: { marketId?: string }) {
  const symbol = (marketId ?? useMarketDataStore((s) => s.symbol))?.replace("-", "").toUpperCase() || "BTCUSDT";
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onEngineReady = useCallback((ctx: any) => {
    // ctx.engine.ui is available
    (window as any).__FK_CHART__ = {
      chart: ctx.chart,
      engine: ctx.engine,
      indicators: ctx.indicators,
      drawings: ctx.drawings,
      overlays: ctx.overlays,
    };
  }, []);

  // ensure feed started for this chart
  React.useEffect(() => {
    marketDataService.startFeed(symbol, "1m");
    return () => {
      // do not stop global feed when navigating away from chart shell unless you intend to
      // marketDataService.stopFeed();
    };
  }, [symbol]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: 620 }}>
      <ChartEngineComponent symbol={symbol} interval="1m" onEngineReady={onEngineReady} />
    </div>
  );
}
