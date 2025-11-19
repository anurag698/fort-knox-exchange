"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CrosshairMode,
  ISeriesApi,
} from "lightweight-charts";
import { getIndicatorState } from "@/hooks/useChartIndicator";
import { smaCalc, emaCalc, rsiCalc, bollingerBands } from "@/lib/indicators";
import { getDrawingTool } from "@/hooks/useDrawingTool";

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

  const sma5SeriesRef = useRef<any>(null);
  const sma20SeriesRef = useRef<any>(null);
  const ema20SeriesRef = useRef<any>(null);
  const ema50SeriesRef = useRef<any>(null);
  const bbUpperSeries = useRef<any>(null);
  const bbMiddleSeries = useRef<any>(null);
  const bbLowerSeries = useRef<any>(null);
  const rsiSeries = useRef<any>(null);
  const shapes = useRef<any[]>([]);
  const tradeMarkersRef = useRef<any[]>([]);

  /* ---------------------------------------------------------
     1. Block WS if Firebase Studio is detected
--------------------------------------------------------- */
  const BLOCK_WS = isFirebaseStudio();
  
  function pushTradeMarker(trade: { p: number; T: number; m: boolean; v: number }) {
    if (!candleSeriesRef.current) return;

    const price = trade.p;
    const time = Math.floor(trade.T / 1000);
    const isSell = trade.m; // MEXC uses m=true ⇒ sell

    // Marker object for lightweight-charts
    const marker = {
        time,
        position: isSell ? 'aboveBar' : 'belowBar',
        shape: isSell ? 'arrowDown' : 'arrowUp',
        color: isSell ? '#ff4668' : '#00ffbf',     // Neon premium colors
        text: `${trade.v}`,
        size: 2,
    };

    tradeMarkersRef.current.push(marker);

    // Keep only last 300 markers
    if (tradeMarkersRef.current.length > 300) {
        tradeMarkersRef.current.splice(0, tradeMarkersRef.current.length - 300);
    }

    candleSeriesRef.current.setMarkers([...tradeMarkersRef.current]);
  }

  function createShape(tool: string, p1: any, p2: any) {
    const chart = chartRef.current;
  
    if (tool === "trendline") {
      return chart.addLineTool({
        points: [p1, p2],
        color: "#4ea3f1",
        lineWidth: 2,
      });
    }
  
    if (tool === "ray") {
      return chart.addRayTool({
        points: [p1, p2],
        color: "#ffb703",
        lineWidth: 2,
      });
    }
  
    if (tool === "hline") {
      return chart.addHorizontalLine({
        price: p1.price,
        color: "#d62828",
        lineWidth: 2,
      });
    }
  
    if (tool === "rectangle") {
      return chart.addBoxTool({
        points: [p1, p2],
        borderColor: "#bb86fc",
        borderWidth: 2,
        backgroundColor: "rgba(187, 134, 252, 0.15)",
      });
    }
  
    return null;
  }

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

    // INDICATOR SERIES
    sma5SeriesRef.current = chart.addLineSeries({ color: "#f6e05e", lineWidth: 1 });
    sma20SeriesRef.current = chart.addLineSeries({ color: "#60a5fa", lineWidth: 1 });
    ema20SeriesRef.current = chart.addLineSeries({ color: "#fb7185", lineWidth: 1 });
    ema50SeriesRef.current = chart.addLineSeries({ color: "#9b5de5", lineWidth: 1 });
    bbUpperSeries.current = chart.addLineSeries({ color: "#ff6b6b", lineWidth: 1 });
    bbMiddleSeries.current = chart.addLineSeries({ color: "#ffd166", lineWidth: 1 });
    bbLowerSeries.current = chart.addLineSeries({ color: "#4ecdc4", lineWidth: 1 });
    
    chart.addPriceScale("rsi", {
      position: "right",
      scaleMargins: { top: 0.7, bottom: 0 },
    });
    rsiSeries.current = chart.addLineSeries({
      color: "#ffd166",
      lineWidth: 1,
      priceScaleId: "rsi",
    });

    setReady(true);

    // Resize observer
    const obs = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current!.clientWidth });
    });
    obs.observe(containerRef.current);
    
    let startPoint: any = null;

    const handlePointerDown = (e: PointerEvent) => {
      const tool = getDrawingTool();
      if (tool === "none") return;

      const chart = chartRef.current;
      const series = candleSeriesRef.current;

      if (!chart || !series) return;

      const rect = containerRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);

      if (!time || !price) return;

      startPoint = { time, price };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!startPoint) return;

      const tool = getDrawingTool();
      const chart = chartRef.current;
      const series = candleSeriesRef.current;

      if (!chart || !series) return;

      const rect = containerRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const time2 = chart.timeScale().coordinateToTime(x);
      const price2 = series.coordinateToPrice(y);

      if (!time2 || !price2) return;

      const shape = createShape(tool, startPoint, { time: time2, price: price2 });
      if (shape) shapes.current.push(shape);

      startPoint = null;
    };
    
    const el = containerRef.current;
    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointerup", handlePointerUp);


    return () => {
      obs.disconnect();
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointerup", handlePointerUp);
      chart.remove();
      chartRef.current = null;
    };
  }, [height]);

  /* ---------------------------------------------------------
     3. LOAD HISTORICAL CANDLES
--------------------------------------------------------- */
  const loadHistory = async () => {
    try {
      tradeMarkersRef.current = [];
      if (candleSeriesRef.current) candleSeriesRef.current.setMarkers([]);

      const end = Math.floor(Date.now() / 1000);
      const start = end - 60 * 60 * 24; // 24h

      const url = `https://api.mexc.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}`;

      const resp = await fetch(url).then((r) => r.json());
      if (!Array.isArray(resp)) return;

      const mapped: Candle[] = resp.map((c) => ({
        t: c[0], o: Number(c[1]), h: Number(c[2]), l: Number(c[3]), c: Number(c[4]), v: Number(c[5]),
      }));

      const data = mapped.map((b) => ({
        time: Math.floor(b.t / 1000), open: b.o, high: b.h, low: b.l, close: b.c,
      }));
      candleSeriesRef.current?.setData(data);

      const vol = mapped.map((b) => ({
        time: Math.floor(b.t / 1000), value: b.v, color: b.c >= b.o ? "#26a69a" : "#ef5350",
      }));
      volumeSeriesRef.current?.setData(vol);

      // INDICATORS
      const closeValues = mapped.map((b) => b.c);
      const times = mapped.map((b) => Math.floor(b.t / 1000));

      if (getIndicatorState("sma5")) sma5SeriesRef.current?.setData(smaCalc(closeValues, 5, times));
      if (getIndicatorState("sma20")) sma20SeriesRef.current?.setData(smaCalc(closeValues, 20, times));
      if (getIndicatorState("ema20")) ema20SeriesRef.current?.setData(emaCalc(closeValues, 20, times));
      if (getIndicatorState("ema50")) ema50SeriesRef.current?.setData(emaCalc(closeValues, 50, times));
      if (getIndicatorState("bb")) {
        const bb = bollingerBands(closeValues, 20, times);
        bbUpperSeries.current?.setData(bb.upper);
        bbMiddleSeries.current?.setData(bb.middle);
        bbLowerSeries.current?.setData(bb.lower);
      }
      if (getIndicatorState("rsi")) rsiSeries.current?.setData(rsiCalc(closeValues, times));
      
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
    if (!ready || BLOCK_WS) return;

    wsRef.current?.close();

    const url = "wss://wbs.mexc.com/ws";
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: "SUBSCRIPTION",
        params: [
          `spot@public.kline.v3.api@${symbol}@${interval}`,
          `spot@public.deal.v3.api@${symbol}`
        ],
        id: 1001,
      }));
    };

    ws.onmessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg.c) return;

        if (msg.c.includes("kline")) {
            const c = msg.d.candle;
            const last = { time: Math.floor(c.t / 1000), open: Number(c.o), high: Number(c.h), low: Number(c.l), close: Number(c.c) };
            candleSeriesRef.current?.update(last);
            volumeSeriesRef.current?.update({ time: last.time, value: Number(c.v), color: last.close >= last.open ? "#26a69a" : "#ef5350" });
        }

        if (msg.c.includes("spot@public.deal.v3.api")) {
            const deals = msg.d?.deals || [];
            deals.forEach((t: any) => {
              pushTradeMarker({
                p: Number(t.p),
                T: Number(t.t),
                m: t.S === 2, // 1 for BUY, 2 for SELL in MEXC v3 deal
                v: Number(t.v),
              });
            });
        }
      } catch (_) {}
    };

    return () => wsRef.current?.close();
  }, [ready, symbol, interval, BLOCK_WS]);

  return <div ref={containerRef} className="w-full h-full relative" />;
}
