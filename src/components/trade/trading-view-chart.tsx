"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import {
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  Time,
} from "lightweight-charts";
import { Maximize } from 'lucide-react';
import { Button } from '../ui/button';

type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
type WSMsg =
  | { type: "kline"; action: "update" | "final"; pair: string; interval: string; candle: Candle }
  | { type: "trade"; pair: string; price: number; amount: number; ts: number };

function LightweightChart({
  marketId,
  setIsChartFullscreen,
  interval = "1m",
  wsUrl = "ws://localhost:8080", // Placeholder for your WebSocket URL
  candlesApi = (p: string, i: string, from: number, to: number) =>
    `/api/marketdata/candles?pair=${encodeURIComponent(p)}&interval=${encodeURIComponent(i)}&from=${from}&to=${to}`,
  initialRangeHours = 24,
  height = 550,
  onClickBar,
}: {
  marketId: string;
  setIsChartFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  interval?: string;
  wsUrl?: string;
  candlesApi?: (pair: string, interval: string, from: number, to: number) => string;
  initialRangeHours?: number;
  height?: number;
  onClickBar?: (candle: Candle) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const throttleRef = useRef<number | null>(null);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: "#08111a" },
        textColor: "#d1d9e6",
      },
      grid: {
        vertLines: { color: "#111827" },
        horzLines: { color: "#111827" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#1f2937" },
      timeScale: { borderColor: "#1f2937", rightOffset: 6 },
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: "volume" },
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    const ro = new ResizeObserver(() =>
      chart.applyOptions({ width: containerRef.current ? containerRef.current.clientWidth : undefined })
    );
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    (async () => {
      if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
      const to = Math.floor(Date.now() / 1000);
      const from = to - initialRangeHours * 60 * 60;

      try {
        const res = await fetch(candlesApi(marketId, interval, from, to));
        if (!res.ok) throw new Error("candles fetch failed");
        const bars: Candle[] = await res.json();

        const seriesData = bars.map((b) => ({
          time: Math.floor(b.t / 1000) as Time,
          open: b.o,
          high: b.h,
          low: b.l,
          close: b.c,
        }));
        const volumeData = bars.map((b) => ({
          time: Math.floor(b.t / 1000) as Time,
          value: b.v,
          color: b.c >= b.o ? "#26a69a" : "#ef5350",
        }));

        candleSeriesRef.current.setData(seriesData);
        volumeSeriesRef.current.setData(volumeData);

        chartRef.current?.timeScale().fitContent();
      } catch (err) {
        console.error("Failed to load historical candles", err);
      }
    })();
  }, [marketId, interval, initialRangeHours, candlesApi]);

  const applyKline = (c: Candle) => {
    const time = Math.floor(c.t / 1000) as Time;
    const bar = { time, open: c.o, high: c.h, low: c.l, close: c.c };
    const vol = { time, value: c.v, color: c.c >= c.o ? "#26a69a" : "#ef5350" };

    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    candleSeriesRef.current.update(bar);
    volumeSeriesRef.current.update(vol);
  };

  useEffect(() => {
    let mounted = true;
    let heartbeatTimer: any = null;

    const connect = () => {
      // NOTE: The user provided a local test server. In a real app, you would
      // connect to your production WebSocket endpoint. For now, this will not connect.
      if (!mounted) return;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            reconnectRef.current = 0;
            ws.send(JSON.stringify({ type: "subscribe", pair: marketId, interval }));
            heartbeatTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
            }, 30000);
        };

        ws.onmessage = (ev) => {
            try {
            const msg: WSMsg = JSON.parse(ev.data);
            if (msg.type === "kline" && msg.pair === marketId && msg.interval === interval) {
                if (throttleRef.current) return;
                throttleRef.current = window.setTimeout(() => {
                applyKline(msg.candle);
                if (throttleRef.current) {
                    window.clearTimeout(throttleRef.current);
                    throttleRef.current = null;
                }
                }, 50);
            }
            } catch (e) {
            console.error("ws msg parse", e);
            }
        };

        ws.onclose = () => {
            setConnected(false);
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            if (!mounted) return;
            reconnectRef.current = Math.min(reconnectRef.current + 1, 10);
            const ms = Math.min(30000, 500 * 2 ** reconnectRef.current);
            setTimeout(connect, ms + Math.random() * 200);
        };

        ws.onerror = (err) => {
            console.error("ws error", err);
            ws.close();
        };
      } catch (e) {
        console.error("Failed to initialize WebSocket:", e);
      }
    };

    // connect(); // We are not connecting to the test server for now.

    return () => {
      mounted = false;
      if (wsRef.current) wsRef.current.close();
    };
  }, [wsUrl, marketId, interval]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const handler = (param: any) => {
      if (!param || !param.time || !onClickBar) return;
      // This part would need a more robust way to get the full candle data on click.
      // For now, it's a placeholder.
    };
    chart.subscribeClick(handler);
    return () => chart.unsubscribeClick(handler);
  }, [onClickBar]);

  return (
    <div className="relative">
      <div ref={containerRef} style={{ width: "100%", height }} />
      <Button
          onClick={() => setIsChartFullscreen(true)}
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 xl:hidden"
          aria-label="Enter fullscreen chart"
      >
        <Maximize className="h-4 w-4" />
      </Button>
      <div className="absolute top-2 left-2 text-xs text-gray-400 bg-background/60 px-2 py-1 rounded">
        {connected ? "● Live" : "○ Disconnected"}
      </div>
    </div>
  );
}

export const MemoizedTradingViewChart = memo(LightweightChart);
export { LightweightChart };
