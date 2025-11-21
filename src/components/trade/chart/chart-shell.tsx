// src/components/trade/chart/chart-shell.tsx
"use client";

import React, { useCallback, useState, useEffect } from "react";
import ChartEngineComponent from "./chart-engine";
import ChartToolbar from "./chart-toolbar";
import TimeframeSwitcher from "./timeframe-switcher";
import { useMarketDataStore } from "@/state/market-data-store";
import marketDataService from "@/services/market-data-service";

export default function ChartShell({ initialSymbol }: { initialSymbol: string }) {
  const storeSymbol = useMarketDataStore((s) => s.symbol);
  const symbol = (initialSymbol ?? storeSymbol).toUpperCase();
  const [engineApi, setEngineApi] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<string>("1m");
  const [chartType, setChartType] = useState<string>("candlestick");

  const onEngineReady = useCallback((ctx: any) => {
    // expose UI object for toolbar
    setEngineApi(ctx.engine?.ui ?? null);
  }, []);

  // ensure feed started for this chart with selected timeframe
  useEffect(() => {
    marketDataService.startFeed(symbol, timeframe);
    return () => {
      // don't stop global feed here by default
      // marketDataService.stopFeed();
    };
  }, [symbol, timeframe]);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setTimeframe(newTimeframe);
    // Restart feed with new timeframe
    marketDataService.stopFeed();
    marketDataService.startFeed(symbol, newTimeframe);
  }, [symbol]);

  // Handle chart type change
  const handleChartTypeChange = useCallback((newType: string) => {
    setChartType(newType);
    if (engineApi?.setChartType) {
      engineApi.setChartType(newType);
    }
  }, [engineApi]);

  return (
    <div className="chart-shell" style={{ width: "100%", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{symbol}</h3>
          <TimeframeSwitcher value={timeframe} onChange={handleTimeframeChange} />
        </div>
        <ChartToolbar 
          engineApi={engineApi} 
          chartType={chartType}
          onChartTypeChange={handleChartTypeChange}
        />
      </div>

      <div style={{ height: "calc(100% - 48px)" }}>
        <ChartEngineComponent 
          symbol={symbol} 
          interval={timeframe}
          chartType={chartType}
          onEngineReady={onEngineReady} 
        />
      </div>
    </div>
  );
}
