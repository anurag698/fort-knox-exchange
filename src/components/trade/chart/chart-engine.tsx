"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CrosshairMode,
  ISeriesApi,
  Time,
} from "lightweight-charts";

type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type ChartEngineProps = {
  symbol: string;
  interval: string;
  chartType: "candles" | "line" | "area";
  height?: number;
};

/* ---------------------------------------------------------
   DETECT FIREBASE STUDIO ENVIRONMENT
--------------------------------------------------------- */
function isFirebaseStudio() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.includes("firebaseapp") ||
    window.location.hostname.includes("firebase") ||
    window.location.hostname.includes("studio") ||
    window.location.href.includes("firebase");
}

export default function ChartEngine({
  symbol,
  interval,
  chartType,
  height = 700,
}: ChartEngineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);

  /* ---------------------------------------------------------
     1. Block WS if Firebase Studio is detected
--------------------------------------------------------- */
  const BLOCK_WS = isFirebaseStudio();

  /* ---------------------------------------------------------
     2. INITIALIZE CHART
--------------------------------------------------------- */
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        backgroundColor: "#060d15",
        textColor: "#d3e4f5",
      },
      grid: {
        vertLines: { color: "#0f1720" },
        horzLines: { color: "#0f1720" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { borderColor: "#0b1220", rightOffset: 10 },
      rightPriceScale: { borderColor: "#0b1220" },
      height,
    });

    chartRef.current = chart;

    // Candle series
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // Volume series
    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    setReady(true);

    // Resize observer
    const obs = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current!.clientWidth });
    });
    obs.observe(containerRef.current);

    return () => {
      obs.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [height]);

  /* ---------------------------------------------------------
     3. LOAD HISTORICAL CANDLES
--------------------------------------------------------- */
  const loadHistory = async () => {
    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 60 * 60 * 24; // 24h

      const url = `https://api.mexc.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}`;

      const resp = await fetch(url).then((r) => r.json());
      if (!Array.isArray(resp)) return;

      const mapped: Candle[] = resp.map((c) => ({
        t: c[0],
        o: Number(c[1]),
        h: Number(c[2]),
        l: Number(c[3]),
        c: Number(c[4]),
        v: Number(c[5]),
      }));

      // Convert to LWC format
      const data = mapped.map((b) => ({
        time: Math.floor(b.t / 1000),
        open: b.o,
        high: b.h,
        low: b.l,
        close: b.c,
      }));

      candleSeriesRef.current?.setData(data);

      const vol = mapped.map((b) => ({
        time: Math.floor(b.t / 1000),
        value: b.v,
        color: b.c >= b.o ? "#26a69a" : "#ef5350",
      }));

      volumeSeriesRef.current?.setData(vol);
    } catch (e) {
      console.warn("History load error", e);
    }
  };

  useEffect(() => {
    if (ready) loadHistory();
  }, [ready, symbol, interval]);

  /* ---------------------------------------------------------
     4. CONNECT REAL-TIME KLINE (MEXC)
--------------------------------------------------------- */
  useEffect(() => {
    if (!ready) return;
    if (BLOCK_WS) return; // Firebase Studio safe mode

    wsRef.current?.close();

    const url = "wss://wbs.mexc.com/ws";
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          method: "SUBSCRIPTION",
          params: [`spot@public.kline.v3.api@${symbol}@${interval}`],
          id: 1001,
        })
      );
    };

    ws.onmessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg.c || !msg.c.includes("kline")) return;

        const c = msg.d.candle;
        const last = {
          time: Math.floor(c.t / 1000),
          open: Number(c.o),
          high: Number(c.h),
          low: Number(c.l),
          close: Number(c.c),
        };

        candleSeriesRef.current?.update(last);

        volumeSeriesRef.current?.update({
          time: last.time,
          value: Number(c.v),
          color: last.close >= last.open ? "#26a69a" : "#ef5350",
        });
      } catch (_) {}
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [ready, symbol, interval, BLOCK_WS]);

  /* ---------------------------------------------------------
     RENDER
--------------------------------------------------------- */
  return (
    <div ref={containerRef} className="w-full h-full relative" />
  );
}
