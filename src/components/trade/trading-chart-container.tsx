// src/components/trade/trading-chart-container.tsx
"use client";

import React, { useCallback, useState, createContext, useContext } from "react";
import ChartEngineComponent from "./chart/chart-engine";
import { ChartToolbar } from "./chart/chart-toolbar";
import marketDataService from "@/services/market-data-service";
import { useMarketDataStore } from "@/state/market-data-store";

import { ChartPersistence } from "@/lib/chart-engine/chart-persistence";

type Interval = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ChartType = "candlestick" | "line" | "area" | "heikin_ashi";

interface ChartContextType {
  engineAPI: any;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  interval: Interval;
  setInterval: (interval: Interval) => void;
  activeIndicators: Set<string>;
  setActiveIndicators: (indicators: Set<string>) => void;
}

// Create context with null as default (properly optional)
const ChartContext = createContext<ChartContextType | null>(null);

// Hook that returns null if context not available (no throw)
export const useChartContext = () => {
  return useContext(ChartContext); // Returns null if not within provider
};

export default function TradingChartContainer({ marketId }: { marketId?: string }) {
  const symbolFromStore = useMarketDataStore((s) => s.symbol);
  const symbol = (marketId ?? symbolFromStore ?? "BTC-USDT").replace("-", "").toUpperCase();

  const [interval, setInterval] = useState<Interval>("1m");
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(new Set());
  const [engineAPI, setEngineAPI] = useState<any>(null);
  const [savedDrawings, setSavedDrawings] = useState<any[]>([]);

  // -------------------------
  // Persistence: Load State
  // -------------------------
  React.useEffect(() => {
    const saved = ChartPersistence.loadState(symbol);
    if (saved) {
      console.log(`[Persistence] Loaded state for ${symbol}`, saved);
      if (saved.interval) setInterval(saved.interval as Interval);
      if (saved.chartType) setChartType(saved.chartType as ChartType);
      if (saved.indicators) setActiveIndicators(new Set(saved.indicators));
      if (saved.drawings) setSavedDrawings(saved.drawings);
    }
  }, [symbol]);

  // -------------------------
  // Persistence: Save State (Interval/Type/Indicators)
  // -------------------------
  React.useEffect(() => {
    const timer = setTimeout(() => {
      ChartPersistence.saveState(symbol, {
        interval,
        chartType,
        indicators: Array.from(activeIndicators),
      });
    }, 1000); // Debounce save
    return () => clearTimeout(timer);
  }, [symbol, interval, chartType, activeIndicators]);


  React.useEffect(() => {
    marketDataService.startFeed(symbol, interval);
    return () => {
      // keep feed alive globally unless you want to stop:
      // marketDataService.stopFeed();
    };
  }, [symbol, interval]);

  const onEngineReady = useCallback((ctx: any) => {
    console.log("[TradingChartContainer] 🟢 Engine Ready!", {
      hasEngine: !!ctx.engine,
      hasUI: !!ctx.engine?.ui
    });
    // Store engine API for toolbar access
    setEngineAPI(ctx);

    // Listen for drawing updates to save them
    if (ctx.engine) {
      ctx.engine.eventBus.on("drawing-update", () => {
        const currentDrawings = ctx.engine.drawings;
        ChartPersistence.saveState(symbol, { drawings: currentDrawings });
      });
    }

    // optionally expose for debug
    (window as any).__FK_CHART__ = {
      engine: ctx.engine,
      chart: ctx.chart,
      overlays: ctx.overlays,
      indicators: ctx.indicators,
      drawings: ctx.drawings,
    };

    // Restore indicators if engine is ready and we have active ones
    if (ctx.engine?.ui) {
      // We could iterate activeIndicators and call addSMA etc. here
    }
  }, []);

  // Keyboard Shortcuts Effect
  React.useEffect(() => {
    if (!engineAPI) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        engineAPI.engine?.ui?.undoDrawing?.();
      }
      // Cancel / Clear Selection (Esc)
      if (e.key === 'Escape') {
        // Clear active tool or selection if implemented
      }
      // Delete Selected (Delete / Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        engineAPI.engine?.ui?.deleteSelectedDrawing?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engineAPI]);

  const handleIntervalChange = useCallback((newInterval: Interval) => {
    setInterval(newInterval);
    marketDataService.startFeed(symbol, newInterval);
  }, [symbol]);

  return (
    <ChartContext.Provider
      value={{
        engineAPI,
        chartType,
        setChartType,
        interval,
        setInterval: handleIntervalChange,
        activeIndicators,
        setActiveIndicators,
      }}
    >
      <div className="h-full w-full flex flex-col bg-card relative overflow-hidden">
        {/* Chart Toolbar - Overlay with proper z-index */}
        <ChartToolbar
          selectedInterval={interval}
          onIntervalChange={handleIntervalChange}
          chartType={chartType}
          onChartTypeChange={setChartType}
        />

        {/* Chart Area */}
        <div className="flex-1 relative">
          <ChartEngineComponent
            symbol={symbol}
            interval={interval}
            chartType={chartType}
            initialDrawings={savedDrawings}
            onEngineReady={onEngineReady}
          />
        </div>
      </div>
    </ChartContext.Provider>
  );
}
