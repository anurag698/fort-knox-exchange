// src/components/trade/lightweight-pro-chart.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  CrosshairMode,
  ISeriesApi,
  DeepPartial,
  ChartOptions,
  IChartApi,
} from "lightweight-charts";
import { useTheme } from "next-themes";

type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type DepthTuple = [number, number];


export default function LightweightProChart({
  pair = "BTC-USDT",
  interval = "1m",
  height = 700,
}: {
  pair?: string;
  interval?: string;
  height?: number;
}) {
  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const depthCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  // UI
  const [connected, setConnected] = useState(false);

  // -------------------------
  // THEME AWARE COLORS
  // -------------------------
  const chartColors = {
    background: theme === "light" ? "#F7F9FC" : "#0D111A",
    text: theme === "light" ? "#1A1F2C" : "#E6EDF3",
    border: theme ===- "light" ? "#E2E8F0" : "#1E2735",
    grid: theme === "light" ? "#E2E8F0" : "#131D2E",
  };


  // --------------------------------------------
  // DEPTH HEATMAP DRAWING (memoized)
  // --------------------------------------------
   const drawDepth = useCallback((depthData: { bids: DepthTuple[]; asks: DepthTuple[] }) => {
    const canvas = depthCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const W = rect.width * devicePixelRatio;
    const H = rect.height * devicePixelRatio;

    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    const { bids, asks } = depthData;
    if (!bids.length || !asks.length) return;

    const maxBid = Math.max(...bids.map((b) => b[1]));
    const maxAsk = Math.max(...asks.map((a) => a[1]));

    const drawSide = (arr: DepthTuple[], isBid: boolean) => {
      const rows = Math.min(arr.length, 120);
      for (let i = 0; i < rows; i++) {
        const size = arr[i][1];
        const intensity = size / (isBid ? maxBid : maxAsk);

        ctx.fillStyle = isBid
          ? `rgba(26, 193, 134, ${0.04 + intensity * 0.18})` // Green
          : `rgba(245, 78, 93, ${0.04 + intensity * 0.18})`; // Red

        const y = (i / rows) * rect.height;
        const width = (rect.width / 2) * intensity;

        ctx.fillRect(
          isBid ? rect.width / 2 - width : rect.width / 2,
          y,
          width,
          Math.max(3, rect.height / rows - 1)
        );
      }
    };

    drawSide(bids, true);
    drawSide(asks, false);

  }, []);



// ------------------------------
// CREATE CHART + SERIES SETUP
// ------------------------------
useEffect(() => {
  if (!containerRef.current) return;

  const container = containerRef.current;

  // CHART OPTIONS
  const chart = createChart(container, {
    layout: {
      background: { color: chartColors.background },
      textColor: chartColors.text
    },
    grid: {
      vertLines: { color: chartColors.grid },
      horzLines: { color: chartColors.grid }
    },
    crosshair: { mode: CrosshairMode.Normal },
    timeScale: {
      borderColor: chartColors.border,
      rightOffset: 8,
      timeVisible: true,
    },
    rightPriceScale: {
      borderColor: chartColors.border,
    },
  });

  chartRef.current = chart;

  // CANDLE SERIES
  const candleSeries = chart.addCandlestickSeries({
    upColor: "#1AC186",
    downColor: "#F54E5D",
    borderUpColor: "#1AC186",
    borderDownColor: "#F54E5D",
    wickUpColor: "#1AC186",
    wickDownColor: "#F54E5D",
  });

  candleSeriesRef.current = candleSeries;

  // VOLUME SERIES
  const volumeSeries = chart.addHistogramSeries({
    priceFormat: { type: "volume" },
    scaleMargins: { top: 0.8, bottom: 0 },
  });

  volumeSeriesRef.current = volumeSeries;

  // DEPTH HEATMAP CANVAS
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "5";

  container.appendChild(canvas);
  depthCanvasRef.current = canvas;

  // Resize Observer
  const obs = new ResizeObserver(() => {
    chart.applyOptions({ width: container.clientWidth, height });
    drawDepth({ bids: [], asks: [] });
  });

  obs.observe(container);

  return () => {
    obs.disconnect();
    chart.remove();
  };
}, [height, drawDepth, chartColors]);



// ------------------------------
// LOAD INITIAL HISTORICAL CANDLES
// ------------------------------
useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 60 * 60 * 24 * 2; // last 48h

      // Using the internal API route for historical data
      const url = `/api/mexc/candles?pair=${pair}&interval=${interval}&from=${from}&to=${to}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!mounted || !candleSeriesRef.current) return;

      const formatted = data.map((c: any) => ({
        time: Math.floor(c.t / 1000),
        open: Number(c.o),
        high: Number(c.h),
        low: Number(c.l),
        close: Number(c.c),
      }));

      candleSeriesRef.current.setData(formatted);

      // Volume data
      const vols = data.map((c: any) => ({
        time: Math.floor(c.t / 1000),
        value: Number(c.v),
        color: c.c >= c.o ? "rgba(26, 193, 134, 0.5)" : "rgba(245, 78, 93, 0.5)",
      }));

      volumeSeriesRef.current?.setData(vols);
    } catch (e) {
      console.error("Historical candles error:", e);
    }
  })();

  return () => {
    mounted = false;
  };
}, [pair, interval, height]);




// ------------------------------
// LIVE MEXC KLINE FEED
// ------------------------------
useEffect(() => {
  if (!pair || !interval) return;

  let mounted = true;
  const symbol = pair.replace("-", "").toUpperCase();
  const mexcInterval = interval === '1d' ? 'Day1' : `Min${interval.replace('m','').replace('h','')}`;


  const ws = new WebSocket("wss://wbs.mexc.com/ws");
  wsRef.current = ws;

  ws.onopen = () => {
    setConnected(true);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          method: "SUBSCRIPTION",
          params: [`spot@public.kline.v3.api@${symbol}@${mexcInterval}`],
        })
      );
    }
  };


  ws.onmessage = (ev) => {
    if (!mounted) return;

    try {
      const msg = JSON.parse(ev.data);

      if (msg.c?.includes("kline.v3.api")) {
        const d = msg.d.k;
        const candle = {
          time: Math.floor(d.t),
          open: Number(d.o),
          high: Number(d.h),
          low: Number(d.l),
          close: Number(d.c),
        };

        candleSeriesRef.current?.update(candle);

        volumeSeriesRef.current?.update({
          time: candle.time,
          value: Number(d.v),
          color: d.c >= d.o ? "rgba(26, 193, 134, 0.5)" : "rgba(245, 78, 93, 0.5)",
        });
      }
    } catch (e) {
      console.error("Kline WS parse error:", e);
    }
  };


  ws.onerror = (err) => {
    console.error("Kline WS error", err);
  };

  ws.onclose = () => {
    setConnected(false);
  };

  return () => {
    mounted = false;
    ws.close(1000);
  };
}, [pair, interval]);




// ------------------------------
// DEPTH HEATMAP WS
// ------------------------------
useEffect(() => {
  const symbol = pair.replace("-", "").toUpperCase();
  const ws = new WebSocket("wss://wbs.mexc.com/ws");

  ws.onopen = () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          method: "SUBSCRIPTION",
          params: [`spot@public.depth.v3.api@${symbol}@0`],
        })
      );
    }
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.c?.includes("depth.v3.api")) {
        const bids = msg.d.bids.map((b: any) => [parseFloat(b.p), parseFloat(b.v)]);
        const asks = msg.d.asks.map((a: any) => [parseFloat(a.p), parseFloat(a.v)]);
        drawDepth({ bids, asks });
      }
    } catch {}
  };
  
  ws.onerror = () => {};
  ws.onclose = () => {};

  return () => ws.close(1000);
}, [pair, drawDepth]);


// ------------------------------
// RENDER
// ------------------------------
return (
  <div ref={containerRef} className="relative w-full h-full" />
);
}
