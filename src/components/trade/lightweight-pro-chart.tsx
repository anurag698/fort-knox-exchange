// src/components/trade/lightweight-pro-chart.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  CrosshairMode,
  ISeriesApi,
  DeepPartial,
  ChartOptions,
} from "lightweight-charts";

/**
 * Lightweight Pro Chart – MEXC Edition
 * Fully Patched + Safe in Firebase Studio
 *
 * Features:
 *  - MEXC Kline v3 real-time candles
 *  - Depth Heatmap
 *  - Volume histogram
 *  - Tooltip
 *  - Alerts
 *  - Fullscreen
 *  - Safe WebSocket usage (never sends while CONNECTING)
 */

type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type MEXCKlineMsg = {
  c: string;
  d: {
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    ts: number;
  };
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
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const klineThrottle = useRef<number | null>(null);
  const depthCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const depthThrottle = useRef<number | null>(null);

  // UI
  const [connected, setConnected] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [alerts, setAlerts] = useState<number[]>([]);

  // -------------------------
  // MAP INTERVAL FOR MEXC
  // -------------------------
  const mapInterval = (i: string) => {
    switch (i) {
      case "1m":
        return "Min1";
      case "5m":
        return "Min5";
      case "15m":
        return "Min15";
      case "1h":
        return "Hour1";
      case "4h":
        return "Hour4";
      case "1d":
        return "Day1";
      default:
        return "Min1";
    }
  };

  // --------------------------------------------
  // CHART INIT
  // --------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { backgroundColor: "#06101a", textColor: "#d6e3f0" },
      grid: {
        vertLines: { color: "#0f1720" },
        horzLines: { color: "#0f1720" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#0b1220" },
      timeScale: { borderColor: "#0b1220" },
      height,
    });

    chartRef.current = chart;

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current!.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [height]);

  // --------------------------------------------
  // LOAD HISTORICAL CANDLES
  // --------------------------------------------
  const loadHistory = useCallback(async () => {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 60 * 60 * 24;

      const url = `/api/mexc/candles?pair=${pair}&interval=${interval}&from=${from}&to=${to}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("History failed");

      const data: Candle[] = await res.json();

      const mapped = data.map((b) => ({
        time: Math.floor(b.t / 1000),
        open: b.o,
        high: b.h,
        low: b.l,
        close: b.c,
      }));

      candleSeriesRef.current?.setData(mapped);

      volumeSeriesRef.current?.setData(
        data.map((b) => ({
          time: Math.floor(b.t / 1000),
          value: b.v,
          color: b.c >= b.o ? "#26a69a" : "#ef5350",
        }))
      );
    } catch (e) {
      console.log("history error", e);
    }
  }, [pair, interval]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // --------------------------------------------
  // MEXC WEBSOCKET — PATCHED FOR SAFETY
  // --------------------------------------------
  useEffect(() => {
    const symbol = pair.replace("-", "").toUpperCase();
    const mxint = mapInterval(interval);

    const ws = new WebSocket("wss://wbs.mexc.com/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);

      // send safely
      ws.send(
        JSON.stringify({
          method: "SUBSCRIPTION",
          params: [`spot@public.kline.v3.api@${symbol}@${mxint}`],
          id: 1,
        })
      );

      ws.send(
        JSON.stringify({
          method: "SUBSCRIPTION",
          params: [`spot@public.depth.v3.api@${symbol}@0`],
          id: 2,
        })
      );
    };

    ws.onerror = () => {
      console.log("WS ERROR (Firebase Studio sandbox)");
    };

    ws.onclose = () => {
      setConnected(false);
    };

    // Unified message handler
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);

        // ---------------- KLINE ----------------
        if (msg.c?.includes("kline.v3.api")) {
          const d = msg.d;

          const c = {
            time: Math.floor(d.ts / 1000),
            open: parseFloat(d.o),
            high: parseFloat(d.h),
            low: parseFloat(d.l),
            close: parseFloat(d.c),
          };

          const vol = parseFloat(d.v);

          if (klineThrottle.current) return;
          klineThrottle.current = window.setTimeout(() => {
            klineThrottle.current = null;

            candleSeriesRef.current?.update(c);
            volumeSeriesRef.current?.update({
              time: c.time,
              value: vol,
              color: c.close >= c.open ? "#26a69a" : "#ef5350",
            });
          }, 50);

          return;
        }

        // ---------------- DEPTH ----------------
        if (msg.c?.includes("depth.v3.api")) {
          const bids = msg.d.bids.map((b: any) => [
            parseFloat(b[0]),
            parseFloat(b[1]),
          ]) as DepthTuple[];

          const asks = msg.d.asks.map((a: any) => [
            parseFloat(a[0]),
            parseFloat(a[1]),
          ]) as DepthTuple[];

          drawDepth(bids, asks);
        }
      } catch (e) {}
    };

    return () => {
      ws.close();
    };
  }, [pair, interval]);

  // --------------------------------------------
  // DEPTH HEATMAP (OPTIMIZED)
  // --------------------------------------------
  const drawDepth = useCallback((bids: DepthTuple[], asks: DepthTuple[]) => {
    const canvas = depthCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (depthThrottle.current) return;
    depthThrottle.current = window.setTimeout(() => {
      depthThrottle.current = null;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = container.getBoundingClientRect();
      const W = rect.width * devicePixelRatio;
      const H = rect.height * devicePixelRatio;

      canvas.width = W;
      canvas.height = H;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      ctx.clearRect(0, 0, rect.width, rect.height);

      const maxBid = bids.length ? Math.max(...bids.map((b) => b[1])) : 1;
      const maxAsk = asks.length ? Math.max(...asks.map((a) => a[1])) : 1;

      const drawSide = (arr: DepthTuple[], isBid: boolean) => {
        const rows = Math.min(arr.length, 120);
        for (let i = 0; i < rows; i++) {
          const size = arr[i][1];
          const intensity = size / (isBid ? maxBid : maxAsk);

          ctx.fillStyle = isBid
            ? `rgba(20,220,150,${0.04 + intensity * 0.18})`
            : `rgba(250,60,60,${0.04 + intensity * 0.18})`;

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
    }, 60);
  }, []);

  // --------------------------------------------
  // DEPTH CANVAS MOUNT
  // --------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:5;";
    depthCanvasRef.current = canvas;

    containerRef.current.appendChild(canvas);

    return () => {
      canvas.remove();
      depthCanvasRef.current = null;
    };
  }, []);

  // --------------------------------------------
  // TOOLTIP
  // --------------------------------------------
  useEffect(() => {
    if (!containerRef.current || !chartRef.current) return;

    const container = containerRef.current;
    const tooltip = document.createElement("div");

    tooltip.style.cssText =
      "position:absolute;display:none;padding:6px;background:rgba(0,0,0,0.65);color:#fff;border-radius:4px;font-size:12px;pointer-events:none;z-index:30;";
    container.appendChild(tooltip);

    const onMove = (param: any) => {
      if (!param?.time || !param.seriesPrices) {
        tooltip.style.display = "none";
        return;
      }

      const p = param.seriesPrices.get(candleSeriesRef.current!);
      if (!p) {
        tooltip.style.display = "none";
        return;
      }

      tooltip.innerHTML = `
        <strong>O:</strong> ${p.open.toFixed(5)}<br/>
        <strong>H:</strong> ${p.high.toFixed(5)}<br/>
        <strong>L:</strong> ${p.low.toFixed(5)}<br/>
        <strong>C:</strong> ${p.close.toFixed(5)}
      `;

      tooltip.style.display = "block";
      tooltip.style.left = param.point.x + 12 + "px";
      tooltip.style.top = param.point.y + 12 + "px";
    };

    chartRef.current.subscribeCrosshairMove(onMove);

    return () => {
      tooltip.remove();
      chartRef.current.unsubscribeCrosshairMove(onMove);
    };
  }, []);

  // --------------------------------------------
  // FULLSCREEN TOGGLE
  // --------------------------------------------
  const toggleFull = () => {
    setIsFull((v) => !v);

    setTimeout(() => {
      chartRef.current?.applyOptions({
        width: containerRef.current!.clientWidth,
        height: isFull ? height : window.innerHeight - 50,
      });
    }, 100);
  };

  // --------------------------------------------
  // PRICE ALERTS
  // --------------------------------------------
  useEffect(() => {
    const int = setInterval(() => {
      try {
        const last = (candleSeriesRef.current as any)?.lastBar?.();
        if (!last) return;

        alerts.forEach((a) => {
          if (Math.abs(last.close - a) < Math.max(0.00001, a * 0.0005)) {
            new Notification(`Alert ${pair}`, {
              body: `${pair} touched ${a}`,
            });

            const snd = new Audio("/sounds/alert.mp3");
            snd.play().catch(() => {});

            setAlerts((x) => x.filter((y) => y !== a));
          }
        });
      } catch {}
    }, 1000);

    return () => clearInterval(int);
  }, [alerts, pair]);

  // --------------------------------------------
  // RENDER
  // --------------------------------------------
  return (
    <div className="relative">
      <div
        className={isFull ? "fixed inset-0 z-[9999] bg-black" : "relative"}
        ref={containerRef}
        style={{
          width: "100%",
          height: isFull ? "100vh" : height,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 30,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={toggleFull}
          style={{
            padding: "6px 10px",
            background: "#1f2937",
            color: "#fff",
            borderRadius: 6,
          }}
        >
          {isFull ? "Exit" : "Fullscreen"}
        </button>

        <button
          onClick={() => {
            const p = prompt("Set alert price:");
            if (!p) return;
            const val = parseFloat(p);
            if (!isNaN(val)) setAlerts((x) => [...x, val]);
          }}
          style={{
            padding: "6px 10px",
            background: "#1f2937",
            color: "#fff",
            borderRadius: 6,
          }}
        >
          Alert
        </button>

        <div
          style={{
            padding: "6px 10px",
            background: connected
              ? "rgba(0,150,80,0.25)"
              : "rgba(200,0,0,0.25)",
            color: "#fff",
            borderRadius: 6,
          }}
        >
          {connected ? "Live" : "Offline"}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          zIndex: 30,
          display: "flex",
          gap: 8,
        }}
      >
        {alerts.map((a) => (
          <div
            key={a}
            style={{
              padding: "4px 8px",
              background: "#111827",
              color: "#fff",
              borderRadius: 6,
            }}
          >
            Alert: {a}
          </div>
        ))}
      </div>
    </div>
  );
}
