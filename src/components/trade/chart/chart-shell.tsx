"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import ChartEngineComponent from "./chart-engine";
import ChartToolbar from "./chart-toolbar";
import TimeframeSwitcher from "./timeframe-switcher";
import MarketSwitcher from "./market-switcher";
import TpSlPanel from "./tp-sl-panel";
import PositionPanel from "./position-panel";
import { MarketDataService } from "@/services/market-data-service";

export default function ChartShell({
  initialSymbol = "BTC-USDT",
  initialInterval = "1m",
}: {
  initialSymbol?: string;
  initialInterval?: string;
}) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [interval, setInterval] = useState(initialInterval);
  const apiRef = useRef<any>(null); // will hold the engine.ui + chart + engine

  // called by ChartEngineComponent on mount
  const handleEngineReady = useCallback((api: any) => {
    apiRef.current = api;
    // optionally configure defaults
    try {
      api.engine.eventBus?.on?.("candle-final", () => {
        // example hook
      });
    } catch {}
  }, []);

  // start the hybrid feed whenever user switches market/timeframe
  const startFeed = useCallback((s: string, i: string) => {
    const normalizedSymbol = s.replace("-", "").toUpperCase();
    // MarketDataService.get returns a HybridFeed instance (Part 13.7-E)
    const feed = MarketDataService.get(normalizedSymbol, i);
    feed.start();
  }, []);

  // call when mounting / when symbol or interval changes
  React.useEffect(() => {
    // stop any old feeds for same page? optional: MarketDataService.stop(...)
    startFeed(symbol, interval);

    // cleanup on unmount
    return () => {
      MarketDataService.stop(symbol, interval);
    };
  }, [symbol, interval, startFeed]);

  const handleMarketChange = (s: string) => {
    setSymbol(s);
    // MarketDataService will be restarted by effect
  };

  const handleIntervalChange = (i: string) => {
    setInterval(i);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-3 p-2 bg-[var(--panel-bg,#07101a)]">
        <MarketSwitcher value={symbol} onChange={handleMarketChange} />
        <TimeframeSwitcher value={interval} onChange={handleIntervalChange} />
        <div className="flex-1" />
        <ChartToolbar apiRef={apiRef} />
      </div>

      <div className="flex-1 relative">
        <ChartEngineComponent
          symbol={symbol}
          interval={interval}
          height={640}
          onEngineReady={handleEngineReady}
        />
        {/* Overlay panels */}
        <div style={{ position: "absolute", right: 12, top: 12, zIndex: 40 }}>
          <PositionPanel apiRef={apiRef} />
        </div>
        <div style={{ position: "absolute", right: 12, bottom: 12, zIndex: 40 }}>
          <TpSlPanel apiRef={apiRef} symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
