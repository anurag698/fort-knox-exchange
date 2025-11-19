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
 * Optimized Chart Engine for MEXC Kline v3 API
 * Channel example:
 * spot@public.kline.v3.api@BTCUSDT@Min1
 */

type Candle = {
  t: number; // ms timestamp
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type MEXCKlineMsg = {
  c: string; // channel
  d: {
    o: string; h: string; l: string; c: string; v: string;
    ts: number; // ms
  };
};

export default function LightweightProChart({
  pair = "BTC-USDT",
  interval = "1m",
  height = 700,
}: {
  pair?: string;
  interval?: string;
  height?: number;
}) {

  /** -----------------------------
   *  Internal Refs
   * ------------------------------ */
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const lastCandleTs = useRef<number | null>(null);
  const throttleTimer = useRef<number | null>(null);

  const [connected, setConnected] = useState(false);

  /** -----------------------------
   *  Chart Initialization
   * ------------------------------ */
  useEffect(() => {
    if (!containerRef.current) return;

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: { backgroundColor: "#06101a", textColor: "#d6e3f0" },
      grid: {
        vertLines: { color: "#0f1720" },
        horzLines: { color: "#0f1720" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#0b1220" },
      timeScale: { borderColor: "#0b1220", rightOffset: 8, timeVisible: true, secondsVisible: false },
    };

    const chart = createChart(containerRef.current, {
      ...chartOptions,
      height,
      width: containerRef.current.clientWidth,
    });
    chartRef.current = chart;

    // Candle series
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });

    // Volume histogram
    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Resize chart
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current!.clientWidth, height: containerRef.current!.clientHeight });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [height]);

  /** -----------------------------
   *  Fetch Historical Candles
   * ------------------------------ */
  const loadHistory = useCallback(async () => {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 60 * 60 * 24; // 24 hours

    const url = `/api/mexc/candles?pair=${pair}&interval=${interval}&from=${from}&to=${to}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load candles");
      const data: Candle[] = await res.json();

      if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

      const mapped = data.map((b) => ({
        time: Math.floor(b.t / 1000) as any,
        open: b.o,
        high: b.h,
        low: b.l,
        close: b.c,
      }));

      candleSeriesRef.current.setData(mapped);

      volumeSeriesRef.current.setData(
        data.map((b) => ({
          time: Math.floor(b.t / 1000) as any,
          value: b.v,
          color: b.c >= b.o ? "#26a69a" : "#ef5350",
        }))
      );

      lastCandleTs.current = data.length
        ? Math.floor(data[data.length - 1].t / 1000)
        : null;
    } catch (err) {
      console.error("Historical load error:", err);
    }
  }, [pair, interval]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /** -----------------------------
   *  Real-Time WebSocket for MEXC
   * ------------------------------ */
  const getMEXCInterval = (i: string) => {
    switch (i) {
      case "1m": return "Min1";
      case "5m": return "Min5";
      case "15m": return "Min15";
      case "1h": return "Hour1";
      case "4h": return "Hour4";
      case "1d": return "Day1";
      default: return "Min1";
    }
  };

  useEffect(() => {
    const symbol = pair.replace("-", "").toUpperCase();
    const intervalMEXC = getMEXCInterval(interval);

    const ws = new WebSocket("wss://wbs.mexc.com/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({
          method: "SUBSCRIPTION",
          params: [`spot@public.kline.v3.api@${symbol}@${intervalMEXC}`],
          id: 101,
        })
      );
    };

    ws.onmessage = (ev) => {
      try {
        const msg: MEXCKlineMsg = JSON.parse(ev.data);
        if (!msg.c || !msg.d) return;

        // Handle MEXC Kline v3
        if (msg.c.includes("kline.v3.api")) {
          const c = msg.d;

          const lc = {
            time: Math.floor(c.ts / 1000) as any,
            open: parseFloat(c.o),
            high: parseFloat(c.h),
            low: parseFloat(c.l),
            close: parseFloat(c.c),
          };

          const vol = parseFloat(c.v);

          // Throttle candle update
          if (throttleTimer.current) return;
          throttleTimer.current = window.setTimeout(() => {
            throttleTimer.current = null;

            if (candleSeriesRef.current) candleSeriesRef.current.update(lc);

            if (volumeSeriesRef.current)
              volumeSeriesRef.current.update({
                time: lc.time,
                value: vol,
                color: lc.close >= lc.open ? "#26a69a" : "#ef5350",
              });

            lastCandleTs.current = lc.time;
          }, 50);
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WS error", error);
    };

    return () => {
      ws.close();
    };
  }, [pair, interval]);

  /** -----------------------------
   *  Indicators (SMA, EMA, RSI)
   * ------------------------------ */
  const ma5Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma10Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma20Ref = useRef<ISeriesApi<"Line"> | null>(null);

  // Helper to calculate SMA
  const sma = (bars: { time: any; value: number }[], period: number) => {
    const res: { time: any; value: number }[] = [];
    for (let i = 0; i < bars.length; i++) {
      if (i < period - 1) continue;
      let sum = 0;
      for (let j = 0; j < period; j++) sum += bars[i - j].value;
      res.push({ time: bars[i].time, value: sum / period });
    }
    return res;
  };

  // Initialize indicators series
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    ma5Ref.current = chart.addLineSeries({ color: "#f6e05e", lineWidth: 1, priceLineVisible: false });
    ma10Ref.current = chart.addLineSeries({ color: "#60a5fa", lineWidth: 1, priceLineVisible: false });
    ma20Ref.current = chart.addLineSeries({ color: "#a78bfa", lineWidth: 1, priceLineVisible: false });
  }, []);

  /** -----------------------------
   *  Tooltip (Safe, Optimized)
   * ------------------------------ */
  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const tooltip = document.createElement("div");

    tooltip.style.cssText =
      "position:absolute;display:none;padding:6px;background:rgba(0,0,0,0.65);color:#fff;border-radius:4px;font-size:12px;pointer-events:none;z-index:30";
    container.appendChild(tooltip);

    const onMove = (param: any) => {
      if (!param || !param.time || !param.seriesPrices) {
        tooltip.style.display = "none";
        return;
      }
      
      if (!candleSeriesRef.current) return;

      const price = param.seriesPrices.get(candleSeriesRef.current);
      if (!price) {
        tooltip.style.display = "none";
        return;
      }

      tooltip.innerHTML = `
        O: ${price.open.toFixed(4)}  
        H: ${price.high.toFixed(4)}  
        L: ${price.low.toFixed(4)}  
        C: ${price.close.toFixed(4)}
      `;

      tooltip.style.display = "block";
      tooltip.style.left = param.point.x + 12 + "px";
      tooltip.style.top = param.point.y + 12 + "px";
    };

    chartRef.current.subscribeCrosshairMove(onMove);

    return () => {
      chartRef.current?.unsubscribeCrosshairMove(onMove);
      tooltip.remove();
    };
  }, []);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        style={{ width: "100%", height }}
        className="relative"
      />

      <div
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          padding: "4px 8px",
          borderRadius: 6,
          background: connected ? "rgba(0,160,80,0.25)" : "rgba(200,0,0,0.25)",
          color: "#fff",
          fontSize: 12,
          zIndex: 20,
        }}
      >
        {connected ? "Live" : "Disconnected"}
      </div>
    </div>
  );
}