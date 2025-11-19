"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, IChartApi } from "lightweight-charts";

// Engine modules (from Part 13.7-A)
import { ChartEngineCore as ChartEngine } from "@/lib/chart-engine/engine-core";
import {
  IndicatorManager,
} from "@/lib/chart-engine/engine-indicators";
import {
  DrawingManager,
} from "@/lib/chart-engine/engine-drawings";
import {
  ChartEngineOverlay,
} from "@/lib/chart-engine/engine-overlay";

interface ChartEngineProps {
  symbol: string;        // e.g. BTCUSDT
  interval: string;      // e.g. 1m, 5m, 15m
  height?: number;       // Chart height
  onEngineReady?: (api: {
    chart: IChartApi;
    engine: ChartEngine;
    indicators: IndicatorManager;
    drawings: DrawingManager;
    overlays: ChartEngineOverlay;
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
  const overlaysRef = useRef<ChartEngineOverlay | null>(null);

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
    const engine = new ChartEngine();
    engineRef.current = engine;

    // 3. Indicators / Drawings / Overlays Managers
    const indicators = new IndicatorManager(chart, engine);
    const drawings = new DrawingManager(chart, engine);
    const overlays = new ChartEngineOverlay(engine);
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
