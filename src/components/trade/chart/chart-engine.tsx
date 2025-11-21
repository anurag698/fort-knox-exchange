"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, ColorType } from "lightweight-charts";
import { bus } from "@/components/bus";
import useMarketDataStore from "@/state/market-data-store";

// Engine modules
import { ChartEngine, calculateHeikinAshi } from "@/lib/chart-engine/engine-core";
import { IndicatorManager } from "@/lib/chart-engine/engine-indicators";
import { DrawingManager } from "@/lib/chart-engine/engine-drawings";
import { OverlayManager } from "@/lib/chart-engine/engine-overlays";
import { LiquidationManager } from "@/lib/chart-engine/engine-liquidations";


interface ChartEngineProps {
  symbol: string;        // e.g. BTCUSDT
  interval: string;      // e.g. 1m, 5m, 15m
  chartType?: "candlestick" | "line" | "area" | "heikin_ashi";  // Chart type
  height?: number | string;       // Chart height
  initialDrawings?: any[];        // Saved drawings to restore
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
  chartType = "candlestick",
  height = "100%",
  initialDrawings = [],
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
  const tradeMarkerSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const currentPositionRef = useRef<any>(null);
  const pnlRef = useRef<any>(null);
  const pnlLineRef = useRef<any>(null);
  const tpLineRef = useRef<any>(null);
  const slLineRef = useRef<any>(null);

  // Theme adaptation
  const [theme, setTheme] = useState<"light" | "dark">("dark");
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
        background: { type: ColorType.Solid, color: theme === "dark" ? "#01060F" : "#FFFFFF" },
        textColor: theme === "dark" ? "#EBF4FF" : "#101B33",
      },
      grid: {
        vertLines: { color: theme === "dark" ? "#07111D" : "#E1E5EE" },
        horzLines: { color: theme === "dark" ? "#07111D" : "#E1E5EE" },
      },
      width: container.clientWidth,
      height: typeof height === 'number' ? height : container.clientHeight,
      rightPriceScale: {
        borderColor: theme === "dark" ? "#12263F" : "#D5DFEF",
      },
      timeScale: {
        borderColor: theme === "dark" ? "#12263F" : "#D5DFEF",
        rightOffset: 8,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: 1 as any },
      handleScroll: {
        vertTouchDrag: false, // Allow vertical page scroll on mobile
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
    });

    chartRef.current = chart;

    // Initialize main series based on chartType
    if (chartType === "line") {
      // Create line series for line chart
      const lineSeries = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
      });
      candleSeriesRef.current = lineSeries as any; // Store in same ref for compatibility
    } else if (chartType === "area") {
      // Create area series for area chart
      const areaSeries = chart.addAreaSeries({
        topColor: 'rgba(41, 98, 255, 0.4)',
        bottomColor: 'rgba(41, 98, 255, 0.0)',
        lineColor: 'rgba(41, 98, 255, 1)',
        lineWidth: 2,
      });
      candleSeriesRef.current = areaSeries as any; // Store in same ref for compatibility
    } else {
      // Create candlestick series for candlestick and heikin_ashi
      candleSeriesRef.current = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
    }

    volumeSeriesRef.current = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay by setting a blank priceScaleId
    });
    // Set volume to overlay on main chart but at bottom
    volumeSeriesRef.current.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // highest point of the series will be 80% away from the top
        bottom: 0,
      },
    });

    tradeMarkerSeriesRef.current = chartType === "candlestick" || chartType === "heikin_ashi"
      ? chart.addCandlestickSeries() // Placeholder for markers if needed
      : null; // No markers for line/area charts

    // 2. Engine Instance
    const engine = new ChartEngine(chart);
    engine.setContainer(container); // Critical for native events (drag/drop)
    engineRef.current = engine;

    // Critical: Link series to engine for DrawingManager
    engine.candleSeries = candleSeriesRef.current;

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
    resizeObserver.current = new ResizeObserver((entries) => {
      if (!container || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });
    resizeObserver.current.observe(container);

    // -------------------------
    // Helper: safe caller
    // -------------------------
    const safe = <T extends (...args: any[]) => any>(fn?: T) => {
      return (...args: Parameters<T>) => {
        try {
          return fn && fn(...(args as any));
        } catch (e) {
          console.warn("Chart API call failed", e);
        }
      };
    };

    // -------------------------
    // Indicators API
    // -------------------------
    const addSMA = safe((period = 20, color = "#f6e05e") => indicators.addSMA(period, color));
    const removeSMA = safe((period = 20) => indicators.removeSMA(period));
    const addEMA = safe((period = 20, color = "#fb7185") => indicators.addEMA(period, color));
    const removeEMA = safe((period = 20) => indicators.removeEMA(period));
    const addRSI = safe((period = 14, panelId = "rsi") => indicators.addRSI(period, panelId));
    const addVWAP = safe((session = "today") => indicators.addVWAP(session));
    const removeVWAP = safe((session = "today") => indicators.removeVWAP(session));
    const addBB = safe((period = 20, stdDev = 2) => indicators.addBB(period, stdDev));
    const removeBB = safe((period = 20, stdDev = 2) => indicators.removeBB(period, stdDev));
    const addMACD = safe((fast = 12, slow = 26, signal = 9) => indicators.addMACD(fast, slow, signal));
    const removeMACD = safe((fast = 12, slow = 26, signal = 9) => indicators.removeMACD(fast, slow, signal));

    // -------------------------
    // Drawing Tools API
    // -------------------------
    const enableFreeDraw = safe(() => drawings.enableFreeDraw());
    const enableTrendTool = safe(() => drawings.enableTrendTool());
    const addTrendLine = safe((p1: any, p2: any) => drawings.addTrend(p1, p2));
    const addFib = safe((high: any, low: any) => drawings.addFib(high, low));
    const clearDrawings = safe(() => drawings.clearAll());

    // -------------------------
    // TP / SL and Multi-entry
    // -------------------------
    const setTPSL = safe((list: { price: number; type: "tp" | "sl" }[]) => overlays.setTPSL(list));
    const setEntries = safe((entries: { price: number; size: number }[]) => overlays.setEntries(entries));
    const setTradeMarkers = safe((markers: { price: number; size: number; side: "buy" | "sell"; ts?: number }[]) => overlays.setTradeMarkers(markers));

    // -------------------------
    // PnL overlay updater
    // -------------------------
    const updatePositionPnl = safe((position: { avgEntry: number; size: number; side?: "long" | "short" }) => {
      try {
        const last = engine.getLastCandle();
        if (!last) return;
        const lastPrice = last.c;
        const side = position.side ?? (position.size >= 0 ? "long" : "short");
        const pnl = side === "long" ? (lastPrice - position.avgEntry) * Math.abs(position.size) : (position.avgEntry - lastPrice) * Math.abs(position.size);
        overlays.setPositionOverlay({
          avgEntry: position.avgEntry,
          size: position.size,
          pnl,
          side,
        });
      } catch (e) {
        console.warn("updatePositionPnl failed", e);
      }
    });

    // -------------------------
    // Expose UI API
    // -------------------------
    (engine as any).ui = {
      addSMA,
      removeSMA,
      addEMA,
      removeEMA,
      addRSI,
      addVWAP,
      removeVWAP,
      addBB,
      removeBB,
      addMACD,
      removeMACD,
      enableFreeDraw,
      enableTrendTool: safe(() => { drawings.activateTool("trend"); }),
      enableRayTool: safe(() => { drawings.activateTool("ray"); }),
      enableMeasureTool: safe(() => { drawings.activateTool("measure"); }),
      enableHorizontalTool: safe(() => { drawings.activateTool("horizontal"); }),
      enableFibTool: safe(() => drawings.enableFibTool()),
      addTrendLine,
      addFib,
      clearDrawings,
      undoDrawing: safe(() => drawings.undoLastDrawing()),
      deleteSelectedDrawing: safe(() => drawings.deleteSelectedDrawing()),
      toggleMagnet: safe(() => drawings.toggleMagnet()),
      setTPSL,
      setEntries,
      setTradeMarkers,
      updatePositionPnl,
      zoomIn: () => {
        const range = chart.timeScale().getVisibleLogicalRange();
        if (range) {
          const span = range.to - range.from;
          const center = (range.to + range.from) / 2;
          const newSpan = span * 0.8;
          chart.timeScale().setVisibleLogicalRange({
            from: center - newSpan / 2,
            to: center + newSpan / 2,
          });
        }
      },
      zoomOut: () => {
        const range = chart.timeScale().getVisibleLogicalRange();
        if (range) {
          const span = range.to - range.from;
          const center = (range.to + range.from) / 2;
          const newSpan = span * 1.25;
          chart.timeScale().setVisibleLogicalRange({
            from: center - newSpan / 2,
            to: center + newSpan / 2,
          });
        }
      },
      resetZoom: () => chart.timeScale().fitContent(),
    };

    // 5. Callback to parent (NOW SAFE TO CALL)
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

    // -------------------------
    // Event Listeners (moved from separate effect)
    // -------------------------
    const onTrade = (t: any) => {
      setTradeMarkers([
        {
          price: t.price,
          size: t.size,
          side: t.side,
          ts: t.ts,
        },
      ]);
    };

    const onFinalCandle = (c: any) => {
      safe(() => indicators.recalculateAll())();
      safe(() => overlays.refreshPositionOverlays())();
    };

    // Listen for kline updates from MarketDataService
    const onKline = (data: any) => {
      if (data.symbol !== symbol || data.interval !== interval) return;
      engine.applyRealtimeCandle(data.candle, interval);
      // Also update the series directly if engine doesn't do it automatically (engine emits 'candles-updated')
    };

    // Engine emits 'candles-updated', we need to update the series
    const onEngineCandlesUpdated = (candles: any[]) => {
      if (candleSeriesRef.current) {
        let data: any[] = [];

        if (chartType === "line" || chartType === "area") {
          data = candles.map(c => ({
            time: Math.floor(c.t / 1000) as any,
            value: c.c,
          }));
        } else if (chartType === "heikin_ashi") {
          data = calculateHeikinAshi(candles);
        } else {
          // Standard Candlestick
          data = candles.map(c => ({
            time: Math.floor(c.t / 1000) as any,
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c,
          }));
        }
        candleSeriesRef.current.setData(data);
      }

      if (volumeSeriesRef.current) {
        const volData = candles.map(c => ({
          time: Math.floor(c.t / 1000) as any,
          value: c.v,
          color: c.c >= c.o ? '#26a69a' : '#ef5350'
        }));
        volumeSeriesRef.current.setData(volData);
      }
    };

    engine.eventBus.on("trade", onTrade);
    engine.eventBus.on("candle-final", onFinalCandle);
    engine.eventBus.on("candles-updated", onEngineCandlesUpdated);

    // Listen to global bus for kline
    bus.on("kline", onKline);

    return () => {
      resizeObserver.current?.disconnect();

      engine.eventBus.off("trade", onTrade);
      engine.eventBus.off("candle-final", onFinalCandle);
      engine.eventBus.off("candles-updated", onEngineCandlesUpdated);

      bus.off("kline", onKline);

      engine.destroy();
      indicators.destroy();
      drawings.destroy();
      overlays.destroy();
      liquidations.destroy();
      chart.remove();
      chartRef.current = null;
      engineRef.current = null;
    };
  }, [theme, height, onEngineReady, chartType]); // Added chartType dependency to recreate chart on type change

  // ------------------------------------------------------------------------
  // HISTORICAL DATA FETCHING
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  // HISTORICAL DATA FETCHING
  // ------------------------------------------------------------------------
  useEffect(() => {
    const fetchHistory = async () => {
      if (!symbol || !interval || !candleSeriesRef.current || !engineRef.current) return;

      try {
        // Use internal API proxy to avoid CORS
        const res = await fetch(`/api/mexc/klines?symbol=${symbol}&interval=${interval}&limit=1000`);
        if (!res.ok) throw new Error("Failed to fetch history");
        const raw = await res.json();

        if (!Array.isArray(raw)) {
          console.warn("Invalid kline data format", raw);
          return;
        }

        // MEXC format: [t, o, h, l, c, v, ...]
        const candles = raw.map((c: any) => ({
          t: c[0],
          o: parseFloat(c[1]),
          h: parseFloat(c[2]),
          l: parseFloat(c[3]),
          c: parseFloat(c[4]),
          v: parseFloat(c[5]),
        }));

        // Sort by time just in case
        candles.sort((a: any, b: any) => a.t - b.t);

        // Update Engine State
        // This will emit 'candles-updated', which triggers onEngineCandlesUpdated
        // onEngineCandlesUpdated handles chartType transformation (HA vs Candle) and updates both series
        if (engineRef.current && engineRef.current.setCandles) {
          engineRef.current.setCandles(candles);
        } else {
          console.warn('[ChartEngine] Engine not ready, skipping setCandles');
        }

        // Fit content after loading history
        // chartRef.current?.timeScale().fitContent(); 

      } catch (e) {
        console.error("Failed to load chart history", e);
      }
    };

    fetchHistory();
  }, [symbol, interval, chartType]); // Added chartType to reload history when type changes (needed for new engine instance)

  // Removed redundant effect that was causing race condition

  // -----------------------------
  // 13.7-D LIVE STREAM INTEGRATION LAYER
  // -----------------------------
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    const tradeMarkerSeries = tradeMarkerSeriesRef.current;
    const indicators = indicatorsRef.current;
    const overlays = overlaysRef.current;

    if (!chart || !candleSeries || !volumeSeries || !tradeMarkerSeries || !indicators || !overlays) return;

    // Firebase Studio sandbox protection (prevent crashes)
    const isSandbox =
      typeof window !== "undefined" &&
      window.location.href.includes("firebase");

    // ------------------------------
    // Candle update throttler (REMOVED - using engine.applyRealtimeCandle instead)
    // ------------------------------
    // Logic moved to primary useEffect to ensure indicators update correctly

    // ------------------------------
    // DEPTH HEATMAP
    // ------------------------------
    let depthTimer: any = null;

    const updateDepthThrottled = (d: any) => {
      if (depthTimer) return;
      depthTimer = setTimeout(() => {
        depthTimer = null;
        if (overlays.setDepth) {
          overlays.setDepth(d.bids || [], d.asks || [], d.mid);
        }
      }, 100);
    };

    // ------------------------------
    // TRADE MARKERS (bubbles)
    // ------------------------------
    const tradeMarkers: any[] = [];
    let tradeTimer: any = null;

    const addTradeMarker = (t: any) => {
      if (!candleSeries) return;

      tradeMarkers.push({
        time: Math.floor(t.t / 1000),
        position: t.S === "buy" ? "belowBar" : "aboveBar",
        color: t.S === "buy" ? "#26a69a" : "#ef5350",
        shape: "circle",
        text: Number(t.p).toFixed(4),
      });

      if (tradeMarkers.length > 50) tradeMarkers.shift();

      if (tradeTimer) return;
      tradeTimer = setTimeout(() => {
        tradeTimer = null;
        if (tradeMarkerSeries) {
          tradeMarkerSeries.setData(tradeMarkers as any);
        }
      }, 120);
    };

    // ------------------------------
    // PNL OVERLAY (Real-time)
    // ------------------------------
    const updatePnL = (ticker: any) => {
      if (!currentPositionRef.current) return;

      const lastPrice = Number(ticker.askPrice || ticker.c || ticker.p);
      if (!lastPrice || Number.isNaN(lastPrice)) return;

      // Recalculate PnL (net across all entries)
      const { entries } = currentPositionRef.current;
      const totalQty = entries.reduce((s: number, e: any) => s + Number(e.qty), 0);
      const avg = entries.reduce((s: number, e: any) => s + Number(e.price) * Number(e.qty), 0) / totalQty;

      const side = currentPositionRef.current.side; // "long" or "short"
      const pnl = side === "long"
        ? (lastPrice - avg) * totalQty
        : (avg - lastPrice) * totalQty;

      if (pnlRef.current) {
        pnlRef.current.innerText = `PnL: ${pnl.toFixed(2)} USDT`;
      }

      // Update floating PnL label on chart
      if (pnlLineRef.current) {
        pnlLineRef.current.applyOptions({
          price: lastPrice,
          title: `PnL ${pnl.toFixed(2)}`,
        });
      }
    };

    // ------------------------------
    // TP / SL Real-time lines
    // ------------------------------
    const updateTpsl = () => {
      if (!currentPositionRef.current) return;

      const { tp, sl } = currentPositionRef.current;

      if (tp && tpLineRef.current) {
        tpLineRef.current.applyOptions({
          price: Number(tp),
          color: "#00e676",
          title: "TP",
        });
      }

      if (sl && slLineRef.current) {
        slLineRef.current.applyOptions({
          price: Number(sl),
          color: "#ff5252",
          title: "SL",
        });
      }
    };

    // --------------------------------------
    // REGISTER EVENT BUS LISTENERS
    // --------------------------------------

    const handleDepth = (payload: any) => {
      if (!isSandbox && payload.depth) updateDepthThrottled(payload.depth);
    };

    const handleTrade = (payload: any) => {
      if (!isSandbox && payload.trade) addTradeMarker(payload.trade);
    };

    const handleTicker = (payload: any) => {
      if (!isSandbox && payload.ticker) {
        updatePnL(payload.ticker);
        updateTpsl();
      }
    };

    bus.on("depth", handleDepth);
    bus.on("trade", handleTrade);
    bus.on("ticker", handleTicker);

    // --------------------------------------
    // CLEANUP
    // --------------------------------------
    return () => {
      bus.off("depth", handleDepth);
      bus.off("trade", handleTrade);
      bus.off("ticker", handleTicker);
    };
  }, [
    chartRef,
    candleSeriesRef,
    volumeSeriesRef,
    overlaysRef,
    tradeMarkerSeriesRef,
  ]);

  // -----------------------------
  // OPTIONAL: short helper export for dev console
  // -----------------------------
  useEffect(() => {
    // attach to window for debugging in dev
    if (process.env.NODE_ENV === "development") {
      (window as any).__FK_CHART__ = {
        engine: engineRef.current,
        chart: chartRef.current,
        indicators: indicatorsRef.current,
        drawings: drawingsRef.current,
        overlays: overlaysRef.current,
      };
    }
    return () => {
      if ((window as any).__FK_CHART__) delete (window as any).__FK_CHART__;
    };
  }, []);


  // ------------------------------------------------------------------------
  // THEME LISTENER
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      const isDark = html.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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
