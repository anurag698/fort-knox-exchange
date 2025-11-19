// src/components/trade/chart/chart-shell.tsx
"use client";

import React, { useCallback, useState } from "react";
import ChartEngineComponent from "./chart-engine";
import ChartToolbar from "./chart-toolbar";
import { useMarketDataStore } from "@/state/market-data-store";
import marketDataService from "@/services/market-data-service";

export default function ChartShell({ initialSymbol }: { initialSymbol?: string }) {
  const storeSymbol = useMarketDataStore((s) => s.symbol);
  const symbol = (initialSymbol ?? storeSymbol ?? "BTCUSDT").replace("-", "").toUpperCase();
  const [engineApi, setEngineApi] = useState<any>(null);

  const onEngineReady = useCallback((ctx: any) => {
    // expose UI object for toolbar
    setEngineApi(ctx.engine?.ui ?? null);
  }, []);

  React.useEffect(() => {
    // ensure feed started for this chart
    marketDataService.startFeed(symbol, "1m");
    return () => {
      // don't stop global feed here by default (unless you intend)
      // marketDataService.stopFeed();
    };
  }, [symbol]);

  return (
    <div className="chart-shell" style={{ width: "100%", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>{symbol}</h3>
        <ChartToolbar engineApi={engineApi} />
      </div>

      <div style={{ height: "calc(100% - 48px)", marginTop: 8 }}>
        <ChartEngineComponent symbol={symbol} interval="1m" height={620} onEngineReady={onEngineReady} />
      </div>
    </div>
  );
}
