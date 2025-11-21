// src/components/trade/chart/chart-shell.tsx
"use client";

import React, { useCallback, useState, useEffect } from "react";
import ChartEngineComponent from "./chart-engine";
import { ChartToolbar } from "./chart-toolbar";
import { useMarketDataStore } from "@/state/market-data-store";
import marketDataService from "@/services/market-data-service";

type Interval = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ChartType = "candlestick" | "line" | "area" | "heikin_ashi";

export default function ChartShell({ initialSymbol }: { initialSymbol?: string }) {
  const symbol = (initialSymbol ?? "BTCUSDT").replace("-", "").toUpperCase();
  const [engineApi, setEngineApi] = useState<any>(null);
  const [interval, setInterval] = useState<Interval>("1m");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [chartKey, setChartKey] = useState(0);

  const onEngineReady = useCallback((ctx: any) => {
    setEngineApi(ctx);
    // Also expose to window for toolbar access
    if (typeof window !== 'undefined') {
      (window as any).__FK_CHART__ = ctx;
    }
  }, []);

  // Start market data feed when interval changes
  useEffect(() => {
    console.log(`🔄 ChartShell: Starting feed for ${symbol} @ ${interval}`);
    marketDataService.startFeed(symbol, interval);

    return () => {
      // Cleanup if needed
    };
  }, [symbol, interval]);

  const handleIntervalChange = (newInterval: Interval) => {
    console.log(`📊 User clicked: ${newInterval}, current: ${interval}`);
    if (newInterval !== interval) {
      setInterval(newInterval);
      // Force chart remount by incrementing key
      setChartKey(prev => prev + 1);
    }
  };

  const handleChartTypeChange = (newType: ChartType) => {
    console.log(`📈 Chart type change: ${chartType} -> ${newType}`);
    if (newType !== chartType) {
      setChartType(newType);
      // Force chart remount for type change
      setChartKey(prev => prev + 1);
    }
  };

  return (
    <div className="relative w-full h-full bg-card">
      {/* Chart Toolbar Overlay */}
      <ChartToolbar
        selectedInterval={interval}
        onIntervalChange={handleIntervalChange}
        chartType={chartType}
        onChartTypeChange={handleChartTypeChange}
        engineAPI={engineApi}
      />

      {/* Chart Engine */}
      <div className="absolute inset-0">
        <ChartEngineComponent
          key={`chart-${chartKey}-${interval}-${chartType}`}
          symbol={symbol}
          interval={interval}
          chartType={chartType}
          height="100%"
          onEngineReady={onEngineReady}
        />
      </div>
    </div>
  );
}
