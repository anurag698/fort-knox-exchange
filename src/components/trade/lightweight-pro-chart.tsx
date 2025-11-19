
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
 * Lightweight Pro Chart
 *
 * Props:
 *  - pair: "BTC-USDT"
 *  - interval: "1m"
 *  - wsUrl: wss/ws string for kline stream
 *  - candlesApi: (pair,interval,from,to)=>string url to fetch historical candles (returns array of {t(ms), o, h, l, c, v})
 *  - onOrderbook?: optional callback called when orderbook updates received (to render heatmap)
 */
type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
type Orderbook = { bids: [number, number][]; asks: [number, number][]; ts?: number };

export default function LightweightProChart({
  pair = "BTC-USDT",
  interval = "1m",
  wsUrl = "ws://localhost:8080",
  candlesApi = (p: string, i: string, from: number, to: number) =>
    `/api/marketdata/candles?pair=${encodeURIComponent(p)}&interval=${encodeURIComponent(i)}&from=${from}&to=${to}`,
  onOrderbook,
  height = 560,
}: {
  pair?: string;
  interval?: string;
  wsUrl?: string;
  candlesApi?: (pair: string, interval: string, from: number, to: number) => string;
  onOrderbook?: (ob: Orderbook) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma5Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma10Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiRef = useRef<ISeriesApi<"Line"> | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const throttler = useRef<number | null>(null);
  const lastCandleTime = useRef<number | null>(null);
  const bufferedCandles = useRef<Candle[] | null>(null);

  const depthCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [connected, setConnected] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [alerts, setAlerts] = useState<number[]>([]);

  // small helper: compute SMA
  const sma = (bars: { time: number; value: number }[], period: number) => {
    const res: { time: number; value: number }[] = [];
    for (let i = 0; i < bars.length; i++) {
      if (i < period - 1) continue;
      let sum = 0;
      for (let j = 0; j < period; j++) sum += bars[i - j].value;
      res.push({ time: bars[i].time, value: sum / period });
    }
    return res;
  };

  // EMA helper
  const ema = (values: number[], period: number) => {
    const k = 2 / (period + 1);
    const res: number[] = [];
    let prev = values[0];
    res.push(prev);
    for (let i = 1; i < values.length; i++) {
      const cur = values[i] * k + prev * (1 - k);
      res.push(cur);
      prev = cur;
    }
    return res;
  };

  // RSI helper (14 period default)
  const rsiCalc = (closes: number[], period = 14) => {
    const res: { time: number; value: number }[] = [];
    if (closes.length < period + 1) return res;
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) gains += d;
      else losses += Math.abs(d);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    for (let i = period + 1; i <= closes.length - 1; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) {
        avgGain = (avgGain * (period - 1) + d) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(d)) / period;
      }
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const val = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
      res.push({ time: i, value: val });
    }
    return res;
  };

  // draw depth heatmap (prototype). Call when orderbook updates are available.
  const drawDepthHeatmap = useCallback((ob: Orderbook | null) => {
    const canvas = depthCanvasRef.current;
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

    if (!ob || (!ob.bids.length && !ob.asks.length)) return;
    // simple prototype: draw left (bids) green gradient and right (asks) red gradient
    const midX = w / 2;
    // normalize volumes
    const maxBid = ob.bids.length ? Math.max(...ob.bids.map((b) => b[1])) : 1;
    const maxAsk = ob.asks.length ? Math.max(...ob.asks.map((a) => a[1])) : 1;

    const drawSide = (arr: [number, number][], left: boolean) => {
      for (let i = 0; i < Math.min(arr.length, 100); i++) {
        const [price, size] = arr[i];
        const intensity = Math.min(1, size / (left ? maxBid : maxAsk));
        const width = (w / 2) * intensity * 0.9;
        ctx.fillStyle = left ? `rgba(0,200,120,${0.02 + 0.18 * intensity})` : `rgba(220,40,60,${0.02 + 0.18 * intensity})`;
        const x = left ? midX - width : midX;
        const y = (i / Math.min(arr.length, 100)) * h;
        ctx.fillRect(x, y, width, Math.max(2, h / Math.min(arr.length, 100) - 1));
      }
    };

    drawSide(ob.bids.slice(0, 100), true);
    drawSide(ob.asks.slice(0, 100), false);
  }, []);

  // create chart
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: { backgroundColor: "#06101a", textColor: "#d6e3f0" },
      grid: { vertLines: { color: "#0f1720" }, horzLines: { color: "#0f1720" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#0b1220" },
      timeScale: { borderColor: "#0b1220", rightOffset: 10 },
    };

    const chart = createChart(container, { ...chartOptions, height });
    chartRef.current = chart;

    // main candle series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });
    candleSeriesRef.current = candleSeries;

    // volume (histogram) with small scale margin
    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: "volume" },
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // MA / EMA lines
    ma5Ref.current = chart.addLineSeries({ color: "#f6e05e", lineWidth: 1 });
    ma10Ref.current = chart.addLineSeries({ color: "#60a5fa", lineWidth: 1 });
    ma20Ref.current = chart.addLineSeries({ color: "#a78bfa", lineWidth: 1 });
    ema20Ref.current = chart.addLineSeries({ color: "#fb7185", lineWidth: 1 });

    // RSI line in the same chart but bottom area (use scaleMargins trick)
    rsiRef.current = chart.addLineSeries({
      color: "#ffd166",
      lineWidth: 1,
      priceLineVisible: false,
    });

    // crosshair tooltip DOM
    const tooltip = document.createElement("div");
    tooltip.style.cssText = "position:absolute;display:none;padding:6px;background:rgba(0,0,0,0.6);color:#fff;border-radius:4px;font-size:12px;pointer-events:none;z-index:10";
    container.appendChild(tooltip);

    const handleCrosshairMove = (param: any) => {
        if (!param || !param.time || !chartRef.current || !candleSeriesRef.current) {
            tooltip.style.display = 'none';
            return;
        }

        const range = chartRef.current.timeScale().getVisibleLogicalRange();
        
        if (
            !range ||
            range.from == null ||
            range.to == null ||
            range.to < range.from ||
            isNaN(range.from) ||
            isNaN(range.to)
        ) {
            tooltip.style.display = 'none';
            return; 
        }
        
        const bars = candleSeriesRef.current.barsInLogicalRange(range);
        if (!bars) {
            tooltip.style.display = 'none';
            return;
        };

        const price = param.seriesPrices.get(candleSeriesRef.current);
        if (!price) {
            tooltip.style.display = 'none';
            return;
        }
      
        let html = "";
        if (price && typeof price === "object") {
            html = `O:${price.open?.toFixed(6) ?? "-"} H:${price.high?.toFixed(6) ?? "-"} L:${price.low?.toFixed(6) ?? "-"} C:${price.close?.toFixed(6) ?? "-"}<br/>V:${(price.volume ?? "-")}`;
        } else {
            html = `time:${String(param.time)}`
        }

        tooltip.innerHTML = html;
        tooltip.style.display = "block";
        const x = param.point?.x ?? 10;
        const y = param.point?.y ?? 10;
        tooltip.style.left = `${x + 12}px`;
        tooltip.style.top = `${y + 12}px`;
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    // resize observer
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
    };
  }, [height]);

  // function to set candles + indicators
  const setCandlesAndIndicators = useCallback((bars: Candle[]) => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    // convert to LC format: time in seconds
    const lc = bars.map((b) => ({
      time: Math.floor(b.t / 1000) as any,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
    }));
    candleSeriesRef.current.setData(lc);

    // volume
    const vol = bars.map((b) => ({
      time: Math.floor(b.t / 1000) as any,
      value: b.v,
      color: b.c >= b.o ? "#26a69a" : "#ef5350",
    }));
    volumeSeriesRef.current.setData(vol);

    // SMA lines (we compute SMA on close)
    const closes = lc.map((b) => ({ time: b.time, value: b.close }));
    const sma5 = sma(closes, 5);
    const sma10 = sma(closes, 10);
    const sma20 = sma(closes, 20);
    if (ma5Ref.current) ma5Ref.current.setData(sma5.map((s) => ({ time: s.time, value: s.value })));
    if (ma10Ref.current) ma10Ref.current.setData(sma10.map((s) => ({ time: s.time, value: s.value })));
    if (ma20Ref.current) ma20Ref.current.setData(sma20.map((s) => ({ time: s.time, value: s.value })));

    // EMA20 example
    const closeValues = lc.map((x) => x.close);
    if (closeValues.length >= 20) {
      const emaVals = ema(closeValues, 20);
      const emaData = emaVals.map((v, idx) => ({ time: lc[idx].time, value: v }));
      if (ema20Ref.current) ema20Ref.current.setData(emaData);
    }

    // RSI: compute on close values -> map to approximate time
    const rsiVals = (() => {
      if (closeValues.length < 16) return [];
      // compute simple RSI using 14 periods
      const res: { time: any; value: number }[] = [];
      let gains = 0, losses = 0;
      for (let i = 1; i <= 14; i++) {
        const d = closeValues[i] - closeValues[i - 1];
        if (d >= 0) gains += d; else losses += Math.abs(d);
      }
      let avgGain = gains / 14, avgLoss = losses / 14;
      for (let i = 15; i < closeValues.length; i++) {
        const d = closeValues[i] - closeValues[i - 1];
        if (d >= 0) {
          avgGain = (avgGain * 13 + d) / 14;
          avgLoss = (avgLoss * 13) / 14;
        } else {
          avgGain = (avgGain * 13) / 14;
          avgLoss = (avgLoss * 13 + Math.abs(d)) / 14;
        }
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const r = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
        res.push({ time: lc[i].time, value: r });
      }
      return res;
    })();
    if (rsiRef.current) rsiRef.current.setData(rsiVals.map((r) => ({ time: r.time, value: r.value })));
  }, []);

  // initial load of historical candles
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - 60 * 60 * 24; // last 24 hours
        const url = candlesApi(pair, interval, from, to);
        const res = await fetch(url);
        if (!res.ok) throw new Error("candles fetch failed");
        const data: Candle[] = await res.json();
        if (!mounted) return;
        setCandlesAndIndicators(data);
        // store last candle time for WS routing
        lastCandleTime.current = data.length ? Math.floor(data[data.length - 1].t / 1000) : null;
      } catch (err) {
        console.error("candles load error", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pair, interval, candlesApi, setCandlesAndIndicators]);

  // WebSocket connect + kline handling
  useEffect(() => {
    if (!wsUrl) return;
    let mounted = true;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        setConnected(true);
        // subscribe message (if your server expects subscribe)
        try {
          ws.send(JSON.stringify({ type: "subscribe", pair, interval }));
        } catch (e) {}
      };
      ws.onmessage = (ev) => {
        if (!mounted) return;
        try {
          const msg = JSON.parse(ev.data);
          // support both raw kline msg {type:"kline"} or Binance-like multiplex
          const isKline = msg.type === "kline" && msg.candle;
          if (isKline && msg.pair === pair && msg.interval === interval) {
            const c: Candle = msg.candle;
            // throttle UI updates
            if (throttler.current) return;
            throttler.current = window.setTimeout(() => {
              throttler.current = null;
              // update the last bar or append
              const lc = {
                time: Math.floor(c.t / 1000) as any,
                open: c.o,
                high: c.h,
                low: c.l,
                close: c.c,
              };
              try {
                // update candle and volume
                candleSeriesRef.current?.update(lc);
                volumeSeriesRef.current?.update({ time: lc.time, value: c.v, color: c.c >= c.o ? "#26a69a" : "#ef5350" });
                // recompute moving averages on update: lightweight approach - append to buffer and recalc a few last points
                // For brevity: request a small historical refresh when final candle arrives
                if ((msg as any).action === "final") {
                  // quick fetch last N candles to resync
                  (async () => {
                    try {
                      const to = Math.floor(Date.now() / 1000);
                      const from = to - 60 * 60 * 4; // last 4 hours
                      const url = candlesApi(pair, interval, from, to);
                      const res = await fetch(url);
                      if (!res.ok) return;
                      const data: Candle[] = await res.json();
                      setCandlesAndIndicators(data);
                    } catch (e) { /* ignore */ }
                  })();
                }
              } catch (e) { console.error(e); }
            }, 60); // throttle 60ms (about 16fps)
          } else if (msg.type === "snapshot" && Array.isArray(msg.candles)) {
            setCandlesAndIndicators(msg.candles);
          } else if (msg.type === "orderbook" && typeof onOrderbook === "function") {
            onOrderbook(msg.orderbook as Orderbook);
            drawDepthHeatmap(msg.orderbook);
          }
        } catch (err) {
          console.error("ws parse", err, ev.data);
        }
      };
      ws.onerror = (ev) => {
        console.error("WS error", ev);
      };
      ws.onclose = (ev) => {
        setConnected(false);
        console.warn("WS closed", ev.code, ev.reason);
        // reconnect logic could be added here (exponential backoff)
      };
    } catch (err) {
      console.error("ws connect failed", err);
    }
    return () => {
      mounted = false;
      try { wsRef.current?.close(); } catch (e) {}
      wsRef.current = null;
    };
  }, [wsUrl, pair, interval, candlesApi, setCandlesAndIndicators, onOrderbook, drawDepthHeatmap]);

  // Alerts: watch last price and trigger Notification/sound when threshold crossed
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") Notification.requestPermission().catch(() => {});
  }, []);

  const addAlert = (price: number) => {
    setAlerts((a) => [...a, price]);
  };

  // simple poll for alerts using last bar close
  useEffect(() => {
    let timer: number | null = null;
    const check = () => {
      try {
        const lastBar = candleSeriesRef.current ? (candleSeriesRef.current as any).lastBar?.() : null;
        if (!lastBar) return;
        const lastPrice = lastBar.close ?? lastBar;
        alerts.forEach((th) => {
          if (!th) return;
          if ((lastPrice >= th && lastPrice - th < Math.max(1e-8, th * 0.01)) || Math.abs(lastPrice - th) < 1e-8) {
            // trigger once and remove
            if (Notification.permission === "granted") {
              new Notification(`Price alert: ${pair}`, { body: `${pair} reached ${th}` });
            }
            const audio = new Audio("/sounds/alert.mp3");
            audio.play().catch(() => {});
            setAlerts((prev) => prev.filter((p) => p !== th));
          }
        });
      } catch (e) {}
    };
    timer = window.setInterval(check, 1000);
    return () => { if (timer) window.clearInterval(timer); };
  }, [alerts, pair]);

  // depth canvas overlay element (absolutely positioned)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;z-index:5";
    container.appendChild(canvas);
    depthCanvasRef.current = canvas;
    // initial draw
    drawDepthHeatmap(null);
    return () => {
      try { canvas.remove(); } catch (e) {}
      depthCanvasRef.current = null;
    };
  }, [drawDepthHeatmap]);

  return (
    <div className="relative">
      <div style={{ position: "relative" }} className={isFull ? "fixed inset-0 z-[9999] bg-black" : ""}>
        <div ref={containerRef} style={{ width: "100%", height: isFull ? "calc(100vh - 48px)" : height, position: "relative" }} />
        {/* ui overlay */}
        <div style={{ position: "absolute", left: 8, top: 8, zIndex: 20, display: "flex", gap: 8 }}>
          <button onClick={() => setIsFull((v) => !v)} style={{ padding: "6px 8px", borderRadius: 6 }}>
            {isFull ? "Exit" : "Fullscreen"}
          </button>
          <button
            onClick={() => {
              const p = prompt("Add price alert at (number):");
              if (!p) return;
              const val = parseFloat(p);
              if (!isNaN(val)) addAlert(val);
            }}
            style={{ padding: "6px 8px", borderRadius: 6 }}
          >
            Add Alert
          </button>
          <div style={{ padding: "6px 8px", borderRadius: 6, background: connected ? "rgba(0,160,80,0.08)" : "rgba(200,0,0,0.06)" }}>
            {connected ? "Live" : "Disconnected"}
          </div>
        </div>
        {/* small footer showing active alerts */}
        <div style={{ position: "absolute", right: 8, bottom: 8, zIndex: 20, display: "flex", gap: 8 }}>
          {alerts.map((a) => (
            <div key={a} style={{ background: "#111827", color: "#fff", padding: "4px 8px", borderRadius: 6 }}>
              Alert: {a}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
