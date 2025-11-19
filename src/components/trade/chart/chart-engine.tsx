"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, IChartApi } from "lightweight-charts";

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
        horzLines: { color: theme === "dark" ? "#07111D" : "#E1E5EE" },
      },
      width: container.clientWidth,
      height,
      rightPriceScale: {
        borderColor: theme === "dark" ? "#12263F" : "#D5DFEF",
      },
      timeScale: {
        borderColor: theme === "dark" ? "#12263F" : "#D5DFEF",
        rightOffset: 8,
      },
      crosshair: { mode: 1 as any },
    });

    chartRef.current = chart;

    // 2. Engine Instance
    const engine = new ChartEngine(chart);
    engineRef.current = engine;

    // 3. Indicators / Drawings / Overlays Managers
    const indicators = new IndicatorManager(chart, engine);
    const drawings = new DrawingManager(chart, engine);
    const overlays = new OverlayManager(chart, engine);
    overlays.init(container); 

    indicatorsRef.current = indicators;
    drawingsRef.current = drawings;
    overlaysRef.current = overlays;

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

      chart.remove();
      chartRef.current = null;
      engineRef.current = null;
      indicatorsRef.current = null;
      drawingsRef.current = null;
      overlaysRef.current = null;
    };
  }, [theme, height, onEngineReady]);

  // ------------------------------------------------------------------------
  // HYBRID KLINE ROUTER (FKX primary, MEXC secondary, offline fallback)
  // ------------------------------------------------------------------------
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    let fkxWS: WebSocket | null = null;
    let mexcWS: WebSocket | null = null;
    let offlineTimer: NodeJS.Timeout | null = null;

    let fkxConnected = false;
    let mexcConnected = false;
    let fkxFailed = false;
    let mexcFailed = false;

    // -------------------------------------------------------------
    // OFFLINE SIMULATOR (Firebase Studio safety)
    // -------------------------------------------------------------
    const startOfflineFallback = () => {
      if (offlineTimer) return;

      console.warn("[FKX-Engine] Offline fallback enabled.");

      offlineTimer = setInterval(() => {
        const last = engine.getLastCandle();
        const t = (last?.t || Date.now()) + 60_000;

        const simulated = {
          t,
          o: last ? last.c : 100,
          h: last ? last.c + Math.random() * 2 : 100.5,
          l: last ? last.c - Math.random() * 2 : 99.5,
          c: last ? last.c + (Math.random() - 0.5) * 3 : 101,
          v: Math.random() * 5,
          final: false,
        };

        engine.applyRealtimeCandle(simulated, interval as any);
      }, 1500);
    };

    const stopOfflineFallback = () => {
      if (offlineTimer) {
        clearInterval(offlineTimer);
        offlineTimer = null;
      }
    };

    // -------------------------------------------------------------
    // FKX WEBSOCKET (Primary)
    // -------------------------------------------------------------
    const connectFKX = () => {
      try {
        fkxWS = new WebSocket("wss://api.fortknox.com/ws");

        fkxWS.onopen = () => {
          fkxConnected = true;
          fkxWS?.send(
            JSON.stringify({
              type: "subscribe",
              channel: "kline",
              symbol,
              interval,
            })
          );
          stopOfflineFallback();
          console.log("[FKX WS] Connected.");
        };

        fkxWS.onerror = () => {
          fkxFailed = true;
          console.warn("[FKX WS] Error.");
        };

        fkxWS.onclose = () => {
          fkxConnected = false;
          console.warn("[FKX WS] Closed.");
          fkxFailed = true;

          // Try fallback to MEXC
          if (!mexcConnected && !mexcFailed) connectMEXC();
          else startOfflineFallback();
        };

        fkxWS.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);

            if (msg.type === "kline" && msg.candle) {
              engine.applyRealtimeCandle(msg.candle, interval as any);
            }
          } catch (e) {
            console.error("[FKX WS] Parse error:", e);
          }
        };
      } catch (e) {
        fkxFailed = true;
        console.error("[FKX WS] Failed to connect:", e);
      }
    };

    // -------------------------------------------------------------
    // MEXC WEBSOCKET (Fallback)
    // -------------------------------------------------------------
    const connectMEXC = () => {
      try {
        const normalized = symbol.toLowerCase();
        const stream = `${normalized}@kline_${interval.replace("m", "")}m`;

        mexcWS = new WebSocket(`wss://wbs.mexc.com/ws`);

        mexcWS.onopen = () => {
          mexcConnected = true;
          mexcWS?.send(
            JSON.stringify({
              method: "SUBSCRIPTION",
              params: [`spot@public.kline.v3.api@${symbol}@Min1`],
              id: 1,
            })
          );

          console.log("[MEXC WS] Fallback connected.");
        };

        mexcWS.onerror = () => {
          mexcFailed = true;
          console.warn("[MEXC WS] Error.");
        };

        mexcWS.onclose = () => {
          mexcConnected = false;
          mexcFailed = true;
          console.warn("[MEXC WS] Closed.");

          if (!fkxConnected) startOfflineFallback();
        };

        mexcWS.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.c && msg.c.includes("kline")) {
              const d = msg.d;
              if (d) {
                const candle = {
                  t: d.ts,
                  o: parseFloat(d.o),
                  h: parseFloat(d.h),
                  l: parseFloat(d.l),
                  c: parseFloat(d.c),
                  v: parseFloat(d.v),
                  final: d.e === "kline_end",
                };
                engine.applyRealtimeCandle(candle, interval as any);
              }
            }
          } catch (e) {
            console.error("[MEXC WS] Parse error:", e);
          }
        };
      } catch (e) {
        mexcFailed = true;
        console.error("[MEXC WS] Failed to connect:", e);
      }
    };

    // -------------------------------------------------------------
    // BOOTSTRAP: FKX → MEXC → OFFLINE
    // -------------------------------------------------------------
    connectFKX();

    const timeout = setTimeout(() => {
      if (!fkxConnected && !mexcConnected) {
        console.warn("[Hybrid Router] FKX & MEXC both not connected → offline mode.");
        startOfflineFallback();
      }
    }, 3000);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeout);

      if (fkxWS) fkxWS.close();
      if (mexcWS) mexcWS.close();
      stopOfflineFallback();
    };
  }, [symbol, interval]);

  // -----------------------------
  // Part 13.7-B (3/3) — Indicators, Drawings, Overlays, API
  // Paste this AFTER the Hybrid WS effect and BEFORE the return in chart-engine.tsx
  // -----------------------------
  useEffect(() => {
    const engine = engineRef.current;
    const indicators = indicatorsRef.current;
    const drawings = drawingsRef.current;
    const overlays = overlaysRef.current;
    const chart = chartRef.current;

    if (!engine || !indicators || !drawings || !overlays || !chart) return;

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
    const addSMA = safe((period = 20, color = "#f6e05e") => {
      if (!indicators) return;
      indicators.addSMA(period, color);
    });

    const removeSMA = safe((period = 20) => {
      indicators?.removeSMA(period);
    });

    const addEMA = safe((period = 20, color = "#fb7185") => {
      indicators?.addEMA(period, color);
    });

    const addRSI = safe((period = 14, panelId = "rsi") => {
      indicators?.addRSI(period, panelId);
    });

    const addVWAP = safe((session = "today") => {
      indicators?.addVWAP(session);
    });

    // -------------------------
    // Drawing Tools API
    // -------------------------
    const enableFreeDraw = safe(() => {
      drawings?.enableFreeDraw();
    });

    const enableTrendTool = safe(() => {
      drawings?.enableTrendTool();
    });

    const addTrendLine = safe((p1: any, p2: any) => {
      drawings?.addTrend(p1, p2);
    });

    const addFib = safe((high: any, low: any) => {
      drawings?.addFib(high, low);
    });

    const clearDrawings = safe(() => {
      drawings?.clearAll();
    });

    // -------------------------
    // TP / SL and Multi-entry
    // -------------------------
    const setTPSL = safe((list: { price: number; type: "tp" | "sl" }[]) => {
      overlays?.setTPSL(list);
    });

    const setEntries = safe((entries: { price: number; size: number }[]) => {
      overlays?.setEntries(entries);
    });

    // -------------------------
    // Trade markers (recent trades)
    // -------------------------
    const setTradeMarkers = safe((markers: { price: number; size: number; side: "buy" | "sell"; ts?: number }[]) => {
      overlays?.setTradeMarkers(markers);
    });

    // -------------------------
    // PnL overlay updater
    // -------------------------
    const updatePositionPnl = safe((position: { avgEntry: number; size: number; side?: "long" | "short" }) => {
      // compute unrealized pnl and display via overlays manager
      try {
        const last = engine.getLastCandle();
        if (!last) return;
        const lastPrice = last.c;
        const side = position.side ?? (position.size >= 0 ? "long" : "short");
        const pnl = side === "long" ? (lastPrice - position.avgEntry) * Math.abs(position.size) : (position.avgEntry - lastPrice) * Math.abs(position.size);
        overlays?.setPositionOverlay({
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
    // Expose UI API for toolbar and parent components
    // -------------------------
    // already passed via onEngineReady once on mount — add a second guard store on engine object
    (engine as any).ui = {
      addSMA,
      removeSMA,
      addEMA,
      addRSI,
      addVWAP,
      enableFreeDraw,
      enableTrendTool,
      addTrendLine,
      addFib,
      clearDrawings,
      setTPSL,
      setEntries,
      setTradeMarkers,
      updatePositionPnl,
      zoomIn: () => chart.timeScale().zoomIn(),
      zoomOut: () => chart.timeScale().zoomOut(),
      resetZoom: () => chart.timeScale().fitContent(),
    };

    // -------------------------
    // Auto-sync some widgets:
    // - When engine emits 'trade', add marker
    // - When new internal-depth arrives, update depth overlay
    // - When a final candle arrives, recompute VWAP/indicators
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

    const onInternalDepth = (d: any) => {
      const bids = d.bids.map((b: any) => [b.price, b.size]);
      const asks = d.asks.map((a: any) => [a.price, a.size]);
      overlays?.setDepth(bids, asks, engine.getLastCandle()?.c ?? 0);
    };

    const onFinalCandle = (c: any) => {
      // Recompute VWAP and indicators lightly
      safe(() => indicators?.recalculateAll())();
      // Update PnL overlays if any
      safe(() => overlays?.refreshPositionOverlays())();
    };

    engine.eventBus.on("trade", onTrade);
    engine.eventBus.on("internal-depth", onInternalDepth);
    engine.eventBus.on("candle-final", onFinalCandle);

    // -------------------------
    // Cleanup
    // -------------------------
    return () => {
      engine.eventBus.off("trade", onTrade);
      engine.eventBus.off("internal-depth", onInternalDepth);
      engine.eventBus.off("candle-final", onFinalCandle);
      // detach ui object
      try {
        delete (engine as any).ui;
      } catch {}
    };
  }, [symbol, interval]);

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
