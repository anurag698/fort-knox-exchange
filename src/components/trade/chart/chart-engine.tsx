
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, IChartApi, ISeriesApi } from "lightweight-charts";
import { bus } from "@/components/bus";

// Engine modules (from Part 13.7-A)
import { ChartEngine } from "@/lib/chart-engine/engine-core";
import {
  IndicatorManager,
} from "@/lib/chart-engine/engine-indicators";
import {
  DrawingManager,
} from "@/lib/chart-engine/engine-drawings";
import {
  OverlayManager,
} from "@/lib/chart-engine/engine-overlays";
import { LiquidationManager } from "@/lib/chart-engine/engine-liquidations";
import marketDataService from "@/services/market-data-service";

interface ChartEngineProps {
  symbol: string;        // e.g. BTCUSDT
  interval: string;      // e.g. 1m, 5m, 15m
  height?: number;       // Chart height
  onEngineReady?: (api: {
    chart: IChartApi;
    engine: ChartEngine;
    indicators: IndicatorManager;
    drawings: DrawingManager;
    overlays: OverlayManager;
    liquidations: LiquidationManager;
  }) => void;
}

export default function ChartEngineComponent({
  symbol,
  interval,
  height = 600,
  onEngineReady,
}: ChartEngineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Chart / Engine refs
  const chartRef = useRef<IChartApi | null>(null);
  const engineRef = useRef<ChartEngine | null>(null);
  const indicatorsRef = useRef<IndicatorManager | null>(null);
  const drawingsRef = useRef<DrawingManager | null>(null);
  const overlaysRef = useRef<OverlayManager | null>(null);
  const liquidationsRef = useRef<LiquidationManager | null>(null);

  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Theme adaptation
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Resize observer attached to container
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // ------------------------------------------------------------------------
  // INITIAL CHART MOUNT
  // ------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Create LW Chart
    const chart = createChart(container, {
      layout: {
        background: { color: theme === "dark" ? "#01060F" : "#FFFFFF" },
        textColor: theme === "dark" ? "#EBF4FF" : "#101B33",
      },
      grid: {
        vertLines: { color: theme === "dark" ? "#07111D" : "#E1E5EE" },
        horzLines: { color: theme === 'dark' ? '#07111D' : '#E1E5EE' },
      },
      width: container.clientWidth,
      height,
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#12263F' : '#D5DFEF',
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#12263F' : '#D5DFEF',
        rightOffset: 8,
      },
      crosshair: { mode: 1 as any },
    });

    chartRef.current = chart;
    candleSeriesRef.current = chart.addCandlestickSeries();
    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Place on a separate scale
    });
    chart.priceScale('').applyOptions({
        scaleMargins: {
            top: 0.8, // 80% of the chart height for the main series
            bottom: 0,
        },
    });


    // 2. Engine Instance
    const engine = new ChartEngine(chart);
    engineRef.current = engine;

    // 3. Indicators / Drawings / Overlays / Liquidations Managers
    const indicators = new IndicatorManager(chart, engine);
    const drawings = new DrawingManager(chart, engine);
    const overlays = new OverlayManager(chart, engine);
    const liquidations = new LiquidationManager(chart, engine);
    overlays.init(container); 

    indicatorsRef.current = indicators;
    drawingsRef.current = drawings;
    overlaysRef.current = overlays;
    liquidationsRef.current = liquidations;

    // 4. Resize Observer
    resizeObserver.current = new ResizeObserver(() => {
      if (!container || !chartRef.current) return;
      chartRef.current.applyOptions({ width: container.clientWidth });
    });
    resizeObserver.current.observe(container);

    // 5. Callback to parent (Toolbar, Shell, Layout)
    if (onEngineReady) {
      onEngineReady({
        chart,
        engine,
        indicators,
        drawings,
        overlays,
        liquidations,
      });
    }

    return () => {
      // Cleanup
      resizeObserver.current?.disconnect();
      resizeObserver.current = null;
      engine.destroy();
      indicators.destroy();
      drawings.destroy();
      overlays.destroy();
      liquidations.destroy();
      chart.remove();
      chartRef.current = null;
    };
  }, [theme, height, onEngineReady]);

  
  // -----------------------------
  // Data Subscription and UI API
  // -----------------------------
  useEffect(() => {
    const engine = engineRef.current;
    const indicators = indicatorsRef.current;
    const drawings = drawingsRef.current;
    const overlays = overlaysRef.current;
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
  
    if (!engine || !indicators || !drawings || !overlays || !chart || !candleSeries || !volumeSeries) return;
  
    // Helper: safe caller
    const safe = <T extends (...args: any[]) => any>(fn?: T) => {
      return (...args: Parameters<T>) => {
        try {
          return fn && fn(...(args as any));
        } catch (e) {
          console.warn("Chart API call failed", e);
        }
      };
    };
  
    // Expose UI API for toolbar and parent components
    (engine as any).ui = {
      addSMA: safe((period = 20, color = "#f6e05e") => indicators.addSMA(period, color)),
      removeSMA: safe((period = 20) => indicators.removeSMA(period)),
      addEMA: safe((period = 20, color = "#fb7185") => indicators.addEMA(period, color)),
      addRSI: safe((period = 14, panelId = "rsi") => indicators.addRSI(period, panelId)),
      addVWAP: safe((session = "today") => indicators.addVWAP(session)),
      enableFreeDraw: safe(() => drawings.enableFreeDraw()),
      enableTrendTool: safe(() => drawings.enableTrendTool()),
      addTrendLine: safe((p1: any, p2: any) => drawings.addTrend(p1, p2)),
      addFib: safe((high: any, low: any) => drawings.addFib(high, low)),
      clearDrawings: safe(() => drawings.clearAll()),
      setTPSL: safe((list: { price: number; type: "tp" | "sl" }[]) => overlays.setTPSL(list)),
      setEntries: safe((entries: { price: number; size: number }[]) => overlays.setEntries(entries)),
      setTradeMarkers: safe((markers: { price: number; size: number; side: "buy" | "sell"; ts?: number }[]) => overlays.setTradeMarkers(markers)),
      updatePositionPnl: safe((position: { avgEntry: number; size: number; side?: "long" | "short" }) => {
        const last = engine.getLastCandle();
        if (!last) return;
        const pnl = (position.side === "long" ? (last.c - position.avgEntry) : (position.avgEntry - last.c)) * Math.abs(position.size);
        overlays.setPositionOverlay({ ...position, pnl });
      }),
      zoomIn: () => chart.timeScale().zoomIn(),
      zoomOut: () => chart.timeScale().zoomOut(),
      resetZoom: () => chart.timeScale().fitContent(),
    };
    
    // Event listeners for data from the bus
    let candleUpdateTimer: any = null;
    const onKline = (k: any) => {
      if (candleUpdateTimer) return;
      candleUpdateTimer = setTimeout(() => {
        candleUpdateTimer = null;
        const time = Math.floor(k.t / 1000) as any;
        candleSeries.update({ time, open: k.o, high: k.h, low: k.l, close: k.c });
        volumeSeries.update({ time, value: k.v, color: k.c >= k.o ? '#26a69a' : '#ef5350' });
        engine.applyRealtimeCandle(k, interval);
        indicators.recalculateAll();
        overlays.refreshPositionOverlays();
      }, 60);
    };

    let depthTimer: any = null;
    const onDepth = (d: any) => {
        if (depthTimer) return;
        depthTimer = setTimeout(() => {
            depthTimer = null;
            overlays.setDepth(d.bids || [], d.asks || [], d.mid);
        }, 100);
    };
    
    const onTrade = (t: any) => overlays.setTradeMarkers([{ price: t.p, size: t.q, side: t.S, ts: t.t }]);

    bus.on("kline", onKline);
    bus.on("depth", onDepth);
    bus.on("trade", onTrade);
  
    // Cleanup
    return () => {
      bus.off("kline", onKline);
      bus.off("depth", onDepth);
      bus.off("trade", onTrade);
      if ((engine as any).ui) delete (engine as any).ui;
    };
  }, [symbol, interval]);

  // ------------------------------------------------------------------------
  // THEME LISTENER (auto-switch when Fort Knox theme changes)
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const html = document.documentElement;

    const observer = new MutationObserver(() => {
      const isDark = html.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // ------------------------------------------------------------------------
  // CHART CONTAINER
  // ------------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: height,
        position: "relative",
        overflow: "hidden",
      }}
    />
  );
}
