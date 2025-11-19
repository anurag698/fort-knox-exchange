"use client";

import {
  createChart,
  CrosshairMode,
  ISeriesApi,
  Time,
} from "lightweight-charts";
import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";

type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type Orderbook = {
  bids: [number, number][];
  asks: [number, number][];
};

export default function LightweightProChart({
  symbol = "BTCUSDT",
  interval = "1m",
  height = 600,
}: {
  symbol?: string;
  interval?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const fallbackTimer = useRef<NodeJS.Timeout | null>(null);

  const [connected, setConnected] = useState(false);

  /* ----------------------------------------------
     DRAW DEPTH HEATMAP  (SAFE FOR FIREBASE STUDIO)
  -----------------------------------------------*/
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawHeatmap = useCallback((ob: Orderbook | null) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    ctx.clearRect(0, 0, w, h);

    if (!ob || !Array.isArray(ob.bids) || !Array.isArray(ob.asks)) return;

    const maxBid = Math.max(...ob.bids.map((b) => b[1]), 1);
    const maxAsk = Math.max(...ob.asks.map((a) => a[1]), 1);

    const mid = w / 2;

    const draw = (data: [number, number][], left: boolean) => {
      for (let i = 0; i < Math.min(data.length, 60); i++) {
        const [_, size] = data[i];
        const intensity = size / (left ? maxBid : maxAsk);
        const barW = intensity * (w / 2);

        ctx.fillStyle = left
          ? `rgba(0,200,120,${0.1 + intensity * 0.2})`
          : `rgba(220,40,60,${0.1 + intensity * 0.2})`;

        const y = (i / 60) * h;
        const x = left ? mid - barW : mid;

        ctx.fillRect(x, y, barW, h / 60 - 1);
      }
    };

    draw(ob.bids, true);
    draw(ob.asks, false);
  }, []);

  /* ----------------------------------------------
     CREATE CHART
  -----------------------------------------------*/
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#d6e3f0",
      },
      grid: {
        vertLines: { color: "#0f1720" },
        horzLines: { color: "#0f1720" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "#1e2636",
      },
      timeScale: {
        borderColor: "#1e2636",
        rightOffset: 12,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [height]);

  /* ----------------------------------------------
     LOAD HISTORICAL CANDLES (MEXC REST)
  -----------------------------------------------*/
  const loadHistory = async () => {
    try {
      const res = await fetch(
        `https://api.mexc.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
      );
      const raw = await res.json();
      if (!Array.isArray(raw)) return;

      const candles: Candle[] = raw.map((c: any) => ({
        t: c[0],
        o: Number(c[1]),
        h: Number(c[2]),
        l: Number(c[3]),
        c: Number(c[4]),
        v: Number(c[5]),
      }));

      const formatted = candles.map((c) => ({
        time: c.t / 1000 as Time,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
      }));

      candleSeriesRef.current?.setData(formatted);

      const vols = candles.map((c) => ({
        time: c.t / 1000 as Time,
        value: c.v,
        color: c.c >= c.o ? "#26a69a" : "#ef5350",
      }));
      volumeSeriesRef.current?.setData(vols);
    } catch (e) {
      console.warn("Failed history", e);
    }
  };

  /* ----------------------------------------------
     CONNECT REALTIME WS (MEXC v3)
     + Safe fallback if WS blocked (Firebase Studio)
  -----------------------------------------------*/
  const connectWS = () => {
    try {
      wsRef.current = new WebSocket("wss://wbs.mexc.com/ws");
    } catch (e) {
      return fallbackPolling();
    }

    wsRef.current.onopen = () => {
      setConnected(true);

      wsRef.current?.send(
        JSON.stringify({
          method: "SUBSCRIPTION",
          params: [`spot@public.kline.v3.api@${symbol}@${interval}`],
          id: 1,
        })
      );
    };

    wsRef.current.onmessage = (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      if (!msg || !msg.d?.k) return;

      const k = msg.d.k;

      candleSeriesRef.current?.update({
        time: k.t / 1000 as Time,
        open: Number(k.o),
        high: Number(k.h),
        low: Number(k.l),
        close: Number(k.c),
      });

      volumeSeriesRef.current?.update({
        time: k.t / 1000 as Time,
        value: Number(k.v),
        color: Number(k.c) >= Number(k.o) ? "#26a69a" : "#ef5350",
      });
    };

    wsRef.current.onclose = (ev) => {
      setConnected(false);

      if (ev.code === 1006) {
        fallbackPolling();
        return;
      }
    };
  };

  /* ----------------------------------------------
     FALLBACK POLLING (Firebase Studio Safe Mode)
  -----------------------------------------------*/
  const fallbackPolling = () => {
    if (fallbackTimer.current) return;

    const safePoll = async () => {
      try {
        const res = await fetch(
          `https://api.mexc.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1`
        );

        const raw = await res.json();
        if (!Array.isArray(raw)) return;

        const c = raw[0];
        candleSeriesRef.current?.update({
          time: c[0] / 1000,
          open: Number(c[1]),
          high: Number(c[2]),
          low: Number(c[3]),
          close: Number(c[4]),
        });
      } catch {}

      fallbackTimer.current = setTimeout(safePoll, 2500);
    };

    safePoll();
  };

  /* ----------------------------------------------
     INIT EFFECT
  -----------------------------------------------*/
  useEffect(() => {
    loadHistory();
    connectWS();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;

      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
  }, [symbol, interval]);

  /* ----------------------------------------------
     DEPTH CANVAS LAYER
  -----------------------------------------------*/
  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "2";

    containerRef.current.appendChild(canvas);
    canvasRef.current = canvas;

    drawHeatmap(null);

    return () => {
      canvas.remove();
      canvasRef.current = null;
    };
  }, [drawHeatmap]);

  /* ----------------------------------------------
     RENDER
  -----------------------------------------------*/
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        position: "relative",
      }}
    >
      {/* status badge */}
      <div className="absolute top-2 right-2 z-30 px-3 py-1 rounded-md text-xs text-white bg-black/30">
        {connected ? "Live" : "Fallback"}
      </div>
    </div>
  );
}
