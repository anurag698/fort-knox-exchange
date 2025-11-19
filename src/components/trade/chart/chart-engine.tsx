
"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
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
  setLiquidationPrice: (price: number, side: "long" | "short") => void;
  addTP: (price: number, size: number) => void;
  removeTP: (id: string) => void;
  onAddEntry: (price: number, size: number) => void;
  onRemoveEntry: (id: string) => void;
  setTP: (price: number) => void;
  setSL: (price: number) => void;
};

function isFirebaseStudio() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.includes("firebaseapp") ||
    window.location.hostname.includes("firebase") ||
    window.location.hostname.includes("studio") ||
    window.location.href.includes("firebase");
}

const ChartEngine = forwardRef<any, ChartEngineProps>(({
  symbol,
  interval,
  chartType,
  height = 700,
  setLiquidationPrice,
  addTP,
  removeTP,
  onAddEntry,
  onRemoveEntry,
  setTP,
  setSL,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const depthCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);
  const lastPriceRef = useRef<number>(0);

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
  const pendingOrdersRef = useRef<{ id: string; price: number; side: "buy" | "sell"; size: number }[]>([]);
  
  const positionRef = useRef<{
    side: "long" | "short" | null;
  }>({
    side: "long",
  });

  const entriesRef = useRef<
    { price: number; size: number; id: string }[]
  >([
    { price: 24586.0, size: 0.6, id: "e1" },
    { price: 24320.0, size: 0.4, id: "e2" },
  ]);

  const tpSlRef = useRef<{
    tp: number | null;
    sl: number | null;
  }>({
    tp: null,
    sl: null,
  });

  const tpTargetsRef = useRef<{ id: string; price: number; size: number; }[]>([]);

  const liquidationRef = useRef<{
    price: number | null;
    side: "long" | "short" | null;
  }>({
    price: null,
    side: null,
  });

  const bracketRef = useRef<{
    entry: number | null;
    tp: number | null;
    sl: number | null;
    active: boolean;
  }>({
    entry: null,
    tp: null,
    sl: null,
    active: false,
  });

  // animation/fills refs
  const fillsRef = useRef<
    {
      id: string;
      price: number;
      side: "buy" | "sell";
      targetSize: number;     // total order size
      filled: number;         // amount already filled (animated)
      backendFilled: number;  // amount reported by backend so far
      startTime: number;      // timestamp when animation started
      duration: number;       // animation duration for this fill chunk (ms)
      color: string;
      completed?: boolean;
    }[]
  >([]);
  const fillAnimationFrame = useRef<number | null>(null);


  useImperativeHandle(ref, () => ({
      addTP: (price: number, size: number) => addTP(price, size),
      removeTP: (id: string) => removeTP(id),
      setTP: (price: number) => setTP(price),
      setSL: (price: number) => setSL(price),
      addEntry: (price: number, size: number) => {
          entriesRef.current.push({ price, size, id: "E" + Math.floor(Math.random() * 9999) });
          renderMultiEntryLines();
      },
      removeEntry: (id: string) => {
          entriesRef.current = entriesRef.current.filter((e) => e.id !== id);
          renderMultiEntryLines();
      },
      reset: () => {
        shapes.current.forEach(s => chartRef.current.removeTool(s));
        shapes.current = [];
      },
      setLiquidationPrice: (price: number, side: "long" | "short") => setLiquidationPrice(price, side),
  }));

  const BLOCK_WS = isFirebaseStudio();
  
  function blendedEntry() {
    const all = entriesRef.current;
    if (!all.length) return null;
    let totalCost = 0;
    let totalSize = 0;
    for (const e of all) {
      totalCost += e.price * e.size;
      totalSize += e.size;
    }
    return totalCost / totalSize;
  }

  function renderMultiEntryLines() {
    const chart = chartRef.current;
    if (!chart || !candleSeriesRef.current) return;

    if (chart.removeAllPriceLines) chart.removeAllPriceLines();

    const blended = blendedEntry();
    const isLong = positionRef.current.side === "long";
    const entryColor = isLong ? "#4ea3f1" : "#ff4668";

    if (blended) {
      chart.createPriceLine({
        price: blended,
        color: entryColor,
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `Avg Entry • ${blended.toFixed(2)}`,
      });
    }

    entriesRef.current.forEach((e) => {
      chart.createPriceLine({
        price: e.price,
        color: "#999",
        lineWidth: 1,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: `Entry ${e.id}: ${e.price.toFixed(2)} (${e.size} BTC)`,
      });
    });
  }

  function renderAllTPs() {
    const chart = chartRef.current;
    if (!chart) return;
    const colors = ["#00ffbf", "#32ff7e", "#ffd166", "#4ea3f1"];
    tpTargetsRef.current.forEach((tp, i) => {
      chart.createPriceLine({
        price: tp.price,
        color: colors[i % colors.length],
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${tp.id} • ${tp.price.toFixed(2)} (${tp.size}%)`,
      });
    });
  }

  function renderTpSlLines() {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    const { tp, sl } = tpSlRef.current;

    // Clear old lines if any - This is handled by renderOrderLines now
    // chart.removeAllPriceLines?.();

    // Re-render entry
    const pos = positionRef.current;
    if (pos.entry) {
      chart.createPriceLine({
        price: pos.entry,
        color: pos.side === "long" ? "#4ea3f1" : "#ff4668",
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `Entry ${pos.entry.toFixed(2)} (${pos.size} BTC)`,
      });
    }

    // Take Profit
    if (tp) {
      chart.createPriceLine({
        price: tp,
        color: "#00ffbf",
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `TP ${tp.toFixed(2)}`,
      });
    }

    // Stop Loss
    if (sl) {
      chart.createPriceLine({
        price: sl,
        color: "#ff4668",
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `SL ${sl.toFixed(2)}`,
      });
    }
  }

  function renderLiquidationLine() {
    if (!chartRef.current) return;
    const { price } = liquidationRef.current;
    if (!price) return;
    chartRef.current.createPriceLine({
      price,
      color: "#ff4668",
      lineWidth: 2,
      lineStyle: 1,
      axisLabelVisible: true,
      title: `LIQUIDATION • ${price.toFixed(2)}`,
    });
  }

  function renderOrderLines() {
    if (!chartRef.current) return;
  
    chartRef.current.removeAllPriceLines?.();
  
    renderMultiEntryLines();
    renderAllTPs();
    renderTpSlLines();
    renderLiquidationLine();
    renderBracketLines();
  
    const colors = {
      buy: "#00ffbf",
      sell: "#ff4668",
    };
  
    pendingOrdersRef.current.forEach((o) => {
      chartRef.current.createPriceLine({
        price: o.price,
        color: colors[o.side],
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${o.side.toUpperCase()} • ${o.price.toFixed(2)} (${o.size} BTC)`,
      });
    });
  }

  function renderBracketLines() {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const { entry, tp, sl, active } = bracketRef.current;

    // This is now handled by renderOrderLines
    // chart.removeAllPriceLines?.();

    if (!active || !entry) return;

    // ENTRY
    chart.createPriceLine({
        price: entry,
        color: "#4ea3f1",
        lineWidth: 2,
        title: `ENTRY • ${entry.toFixed(2)}`,
    });

    // TP
    if (tp) {
        const reward = ((tp - entry) / entry) * 100;
        chart.createPriceLine({
        price: tp,
        color: "#00ffbf",
        lineWidth: 2,
        title: `TP • ${tp.toFixed(2)} (+${reward.toFixed(2)}%)`,
        });
    }

    // SL
    if (sl) {
        const risk = ((sl - entry) / entry) * 100;
        chart.createPriceLine({
        price: sl,
        color: "#ff4668",
        lineWidth: 2,
        title: `SL • ${sl.toFixed(2)} (${risk.toFixed(2)}%)`,
        });
    }
  }

  function pushTradeMarker(trade: { p: number; T: number; m: boolean; v: number }) {
    if (!candleSeriesRef.current) return;
    
    const isSell = trade.m;
    const marker = {
      time: Math.floor(trade.T / 1000),
      position: isSell ? 'aboveBar' : 'belowBar',
      shape: isSell ? 'arrowDown' : 'arrowUp',
      color: isSell ? '#ff4668' : '#00ffbf',
      text: `${trade.v}`,
      size: 2,
    };

    tradeMarkersRef.current.push(marker);

    if (tradeMarkersRef.current.length > 300) {
      tradeMarkersRef.current.splice(0, tradeMarkersRef.current.length - 300);
    }
    candleSeriesRef.current.setMarkers([...tradeMarkersRef.current]);
  }

  function createShape(tool: string, p1: any, p2: any) {
    const chart = chartRef.current;
    if (tool === "trendline") return chart.addLineTool({ points: [p1, p2], color: "#4ea3f1", lineWidth: 2 });
    if (tool === "ray") return chart.addRayTool({ points: [p1, p2], color: "#ffb703", lineWidth: 2 });
    if (tool === "hline") return chart.addHorizontalLine({ price: p1.price, color: "#d62828", lineWidth: 2 });
    if (tool === "rectangle") return chart.addBoxTool({ points: [p1, p2], borderColor: "#bb86fc", borderWidth: 2, backgroundColor: "rgba(187, 134, 252, 0.15)" });
    return null;
  }
  
  function drawPnLZone(entry: number, last: number, side: "long" | "short" | null) {
    const canvas = depthCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !chartRef.current) return;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;
    
    // Defer clearing to a master draw function to avoid flicker
    // const rect = container.getBoundingClientRect();
    // canvas.width = rect.width * devicePixelRatio;
    // canvas.height = rect.height * devicePixelRatio;
    // ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    // ctx.clearRect(0, 0, rect.width, rect.height);
    const rect = container.getBoundingClientRect();

    const chart = chartRef.current;
    const priceToY = (p: number) => chart.priceScale("right").priceToCoordinate(p) ?? 0;
    const yEntry = priceToY(entry);
    const yLast = priceToY(last);
    const profitable = side === "long" ? last >= entry : last <= entry;
    ctx.fillStyle = profitable ? "rgba(0,255,191,0.07)" : "rgba(255,70,104,0.07)";
    const top = Math.min(yEntry, yLast);
    const height = Math.abs(yEntry - yLast);
    ctx.fillRect(0, top, rect.width, height);
  }

  function drawLiquidationZone(currentPrice: number) {
    const liq = liquidationRef.current.price;
    const canvas = depthCanvasRef.current;
    const container = containerRef.current;
    if (!liq || !canvas || !container || !chartRef.current) return;

    const ctx = canvas.getContext("2d");
    if(!ctx) return;
    const rect = container.getBoundingClientRect();

    const chart = chartRef.current;
    const yLiq = chart.priceScale("right").priceToCoordinate(liq);
    const yCur = chart.priceScale("right").priceToCoordinate(currentPrice);
    if (!yLiq || !yCur) return;
    const distance = Math.abs(yLiq - yCur);
    const maxDanger = 140; // px threshold
    const opacity = Math.min(1, 1 - distance / maxDanger);
    ctx.fillStyle = `rgba(255, 70, 104, ${opacity * 0.25})`;
    const y = Math.min(yLiq, yCur);
    const h = Math.abs(yLiq - yCur);
    ctx.fillRect(0, y, rect.width, h);
  }

  function drawOverlays(lastPrice: number) {
    const canvas = depthCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Draw PnL Zone if applicable
    const entry = blendedEntry();
    if (entry) {
        drawPnLZone(entry, lastPrice, positionRef.current.side);
    }
    
    // Draw Liquidation Zone
    drawLiquidationZone(lastPrice);

    // Draw Fills
    drawOrderFillsOverlay();
  }

  function renderPositionOverlay(lastPrice: number) {
    const chart = chartRef.current;
    if (!chart || !candleSeriesRef.current) return;
    
    const entry = blendedEntry();
    if (!entry) return;

    const pos = positionRef.current;
    const size = entriesRef.current.reduce((s, e) => s + e.size, 0);
    const diff = pos.side === "long" ? lastPrice - entry : entry - lastPrice;
    const pct = (diff / entry) * 100;
    const pnlUSD = diff * size;
    const pnlColor = diff >= 0 ? "#00ffbf" : "#ff4668";

    chart.priceScale("right").applyOptions({ borderColor: pnlColor });
    
    const markers: any[] = [...tradeMarkersRef.current];
    markers.push({ time: Math.floor(Date.now() / 1000), position: 'right', color: pnlColor, shape: 'circle', text: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%  (${pnlUSD >= 0 ? "+" : ""}${pnlUSD.toFixed(2)}$)` });

    tpTargetsRef.current.forEach(tp => {
        const isLong = pos.side === "long";
        if (!entry) return;
        const diffTP = isLong ? tp.price - entry : entry - tp.price;
        const pctTP = (diffTP / entry) * 100;
        const pnlUSDTP = diffTP * (tp.size / 100) * size;
        markers.push({ time: Math.floor(Date.now() / 1000), price: tp.price, position: "right", color: "#32ff7e", shape: "circle", text: `${tp.id}: ${pctTP.toFixed(2)}% / $${pnlUSDTP.toFixed(2)}` });
    });

    candleSeriesRef.current.setMarkers(markers);
    drawOverlays(lastPrice);
  }

  function drawOrderFillsOverlay() {
    const canvas = depthCanvasRef.current;
    const container = containerRef.current;
    const chart = chartRef.current;
    if (!canvas || !container || !chart) return;
  
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    const rect = container.getBoundingClientRect();
    
    fillsRef.current.forEach((f) => {
      const y = candleSeriesRef.current?.priceToCoordinate(f.price);
      if (y == null || Number.isNaN(y)) return;
  
      const barHeight = 8;
      const barWidthMax = Math.min(rect.width * 0.5, 260);
      const progress = Math.min(1, f.filled / Math.max(1, f.targetSize));
      const width = progress * barWidthMax;
  
      const x = f.side === "buy" ? 8 : rect.width - 8 - width;
      const barY = Math.round(y - barHeight / 2);
  
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(f.side === "buy" ? 8 : rect.width - 8 - barWidthMax, barY, barWidthMax, barHeight);
  
      ctx.fillStyle = f.color || (f.side === "buy" ? "rgba(0,255,191,0.9)" : "rgba(255,70,104,0.9)");
      ctx.fillRect(x, barY, width, barHeight);
  
      if (f.completed) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 1, barY - 1, width + 2, barHeight + 2);
      }
  
      ctx.font = "11px Inter, Arial";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      const pctText = `${((progress) * 100).toFixed(1)}%`;
      const volText = `${f.filled.toFixed(4)}/${f.targetSize.toFixed(4)}`;
      const label = `${pctText} ${volText} @ ${f.price}`;
      const labelX = f.side === "buy" ? x + width + 8 : x - ctx.measureText(label).width - 8;
      ctx.fillText(label, Math.max(4, labelX), barY + barHeight / 2);
    });
  }

  function animateFillsLoop() {
    if (fillAnimationFrame.current) {
      cancelAnimationFrame(fillAnimationFrame.current);
      fillAnimationFrame.current = null;
    }
  
    const tick = (time: number) => {
      let needNext = false;
      const now = performance.now();
  
      fillsRef.current.forEach((f) => {
        if (f.completed) return;
        const elapsed = now - f.startTime;
        const ratio = Math.min(1, elapsed / Math.max(1, f.duration || 600));
        const target = f.backendFilled;
        const prev = f.filled;
        const targetFilled = prev + (target - prev) * Math.min(0.6, ratio);
        f.filled = Math.min(target, targetFilled);
  
        if (f.backendFilled >= f.targetSize && Math.abs(f.targetSize - f.filled) < 1e-8) {
          f.completed = true;
        }
  
        if (!f.completed) needNext = true;
      });
  
      drawOverlays(lastPriceRef.current);
  
      if (needNext) {
        fillAnimationFrame.current = requestAnimationFrame(tick);
      } else {
        fillAnimationFrame.current = null;
      }
    };
  
    fillAnimationFrame.current = requestAnimationFrame(tick);
  }

  function startFillAnimation(
    orderId: string,
    filledAmount: number,
    targetSize: number,
    side: "buy" | "sell",
    price: number,
    duration = 700
  ) {
    let f = fillsRef.current.find((x) => x.id === orderId);
    if (!f) {
      f = {
        id: orderId,
        price,
        side,
        targetSize,
        filled: 0,
        backendFilled: 0,
        startTime: performance.now(),
        duration,
        color: side === "buy" ? "rgba(0,255,191,0.95)" : "rgba(255,70,104,0.95)",
      };
      fillsRef.current.push(f);
    }
  
    f.backendFilled = Math.min(targetSize, filledAmount);
    f.startTime = performance.now();
    f.duration = duration;
    f.completed = f.backendFilled >= targetSize;
  
    animateFillsLoop();
  }
  
  useEffect(() => {
    return () => {
      if (fillAnimationFrame.current) {
        cancelAnimationFrame(fillAnimationFrame.current);
      }
    };
  }, []);


  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, { layout: { backgroundColor: "#060d15", textColor: "#d3e4f5" }, grid: { vertLines: { color: "#0f1720" }, horzLines: { color: "#0f1720" } }, crosshair: { mode: CrosshairMode.Normal }, timeScale: { borderColor: "#0b1220", rightOffset: 10 }, rightPriceScale: { borderColor: "#0b1220" }, height });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addCandlestickSeries({ upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350", wickUpColor: "#26a69a", wickDownColor: "#ef5350" });
    volumeSeriesRef.current = chart.addHistogramSeries({ priceFormat: { type: "volume" }, scaleMargins: { top: 0.8, bottom: 0 } });
    sma5SeriesRef.current = chart.addLineSeries({ color: "#f6e05e", lineWidth: 1 });
    sma20SeriesRef.current = chart.addLineSeries({ color: "#60a5fa", lineWidth: 1 });
    ema20SeriesRef.current = chart.addLineSeries({ color: "#fb7185", lineWidth: 1 });
    ema50SeriesRef.current = chart.addLineSeries({ color: "#9b5de5", lineWidth: 1 });
    bbUpperSeries.current = chart.addLineSeries({ color: "#ff6b6b", lineWidth: 1 });
    bbMiddleSeries.current = chart.addLineSeries({ color: "#ffd166", lineWidth: 1 });
    bbLowerSeries.current = chart.addLineSeries({ color: "#4ecdc4", lineWidth: 1 });
    chart.addPriceScale("rsi", { position: "right", scaleMargins: { top: 0.7, bottom: 0 } });
    rsiSeries.current = chart.addLineSeries({ color: "#ffd166", lineWidth: 1, priceScaleId: "rsi" });
    setReady(true);
    const obs = new ResizeObserver(() => chart.applyOptions({ width: containerRef.current!.clientWidth }));
    obs.observe(containerRef.current);
    
    let startPoint: any = null;
    let draggingOrderId: string | null = null;
    let draggingTp = false;
    let draggingSl = false;
    let draggingTP: string | null = null;
    let draggingBracket: "entry" | "tp" | "sl" | null = null;
    
    const onPointerDown = (e: PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const x = e.clientX - rect.left;
        const price = candleSeriesRef.current!.coordinateToPrice(y);
        const time = chart.timeScale().coordinateToTime(x);

        if (!time || !price) return;
        
        if (e.shiftKey) {
            bracketRef.current.entry = price;
            bracketRef.current.sl = price * 0.99;
            bracketRef.current.tp = price * 1.02;
            bracketRef.current.active = true;
            renderBracketLines();
            return;
        }

        const priceToY = (p: number | null) => p ? candleSeriesRef.current!.priceToCoordinate(p) : null;
        
        if (bracketRef.current.active) {
            const { entry, tp, sl } = bracketRef.current;
            if (entry && Math.abs(priceToY(entry)! - y) < 8) draggingBracket = "entry";
            if (tp && Math.abs(priceToY(tp)! - y) < 8) draggingBracket = "tp";
            if (sl && Math.abs(priceToY(sl)! - y) < 8) draggingBracket = "sl";
        }

        const tool = getDrawingTool();
        if (tool !== "none") {
            startPoint = { time, price };
        } else if (e.altKey) {
            const last = lastPriceRef.current;
            const side = price < last ? "buy" : "sell";
            const id = "O" + Math.floor(Math.random() * 999999);
            const size = 0.1;
            pendingOrdersRef.current.push({ id, price, size, side });
            renderOrderLines();
            
            // MOCK FILL ANIMATION
            setTimeout(() => startFillAnimation(id, size * 0.25, size, side, price), 500);
            setTimeout(() => startFillAnimation(id, size * 0.6, size, side, price), 1200);
            setTimeout(() => startFillAnimation(id, size * 1.0, size, side, price), 2200);
            
        } else {
            const { tp, sl } = tpSlRef.current;
            const tpY = tp ? priceToY(tp) : null;
            const slY = sl ? priceToY(sl) : null;
            if (tpY && Math.abs(tpY - y) < 8) draggingTp = true;
            if (slY && Math.abs(slY - y) < 8) draggingSl = true;
            
            tpTargetsRef.current.forEach(tpTarget => {
              const yTp = priceToY(tpTarget.price);
              if (yTp && Math.abs(yTp - y) < 8) draggingTP = tpTarget.id;
            });
            pendingOrdersRef.current.forEach((o) => {
                const yOrder = priceToY(o.price);
                if (yOrder && Math.abs(yOrder - y) < 8) draggingOrderId = o.id;
            });
        }
    };
    
    const onPointerUp = (e: PointerEvent) => {
      draggingBracket = null;
      draggingTp = false;
      draggingSl = false;
      draggingTP = null;
      draggingOrderId = null;

      if (!startPoint) return;
      const tool = getDrawingTool();
      const chart = chartRef.current;
      const series = candleSeriesRef.current;
      if(!chart || !series || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const time2 = chart.timeScale().coordinateToTime(x);
      const price2 = series.coordinateToPrice(y);
      if (!time2 || !price2) return;
      const shape = createShape(tool, startPoint, { time: time2, price: price2 });
      if (shape) shapes.current.push(shape);
      startPoint = null;
    };
    
    const onPointerMove = (e: PointerEvent) => {
        if (!candleSeriesRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const price = candleSeriesRef.current.coordinateToPrice(e.clientY - rect.top);
        if (!price) return;
        
        if (draggingBracket) {
            if (draggingBracket === "entry") {
                const delta = price - bracketRef.current.entry!;
                bracketRef.current.entry = price;
                bracketRef.current.tp! += delta;
                bracketRef.current.sl! += delta;
            } else if (draggingBracket === "tp") {
                bracketRef.current.tp = price;
            } else if (draggingBracket === "sl") {
                bracketRef.current.sl = price;
            }
            renderBracketLines();
            return;
        }

        const tool = getDrawingTool();
        if (tool !== "none") return;
        
        if (draggingTp) { setTP(price); }
        if (draggingSl) { setSL(price); }
        if (draggingTP) {
          const tp = tpTargetsRef.current.find(t => t.id === draggingTP);
          if (tp) { tp.price = price; renderAllTPs(); }
        }
        if (draggingOrderId) {
            const order = pendingOrdersRef.current.find((o) => o.id === draggingOrderId);
            if (order) { order.price = price; renderOrderLines(); }
        }
    };

    const onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        
        if (bracketRef.current.active) {
            bracketRef.current.active = false;
            renderBracketLines();
            return;
        }

        if (!candleSeriesRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const price = candleSeriesRef.current!.coordinateToPrice(y);
        if (!price) return;
        pendingOrdersRef.current = pendingOrdersRef.current.filter(
            (o) => Math.abs(o.price - price) > 1e-2
        );
        renderOrderLines();
    };

    const el = containerRef.current;
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("contextmenu", onContextMenu);

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute"; canvas.style.left = "0"; canvas.style.top = "0"; canvas.style.pointerEvents = "none"; canvas.style.zIndex = "2";
    el.appendChild(canvas);
    depthCanvasRef.current = canvas;

    return () => {
      obs.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("contextmenu", onContextMenu);
      chart.remove();
      chartRef.current = null;
      if (depthCanvasRef.current) depthCanvasRef.current.remove();
    };
  }, [height]);

  const loadHistory = async () => {
    try {
      tradeMarkersRef.current = [];
      if (candleSeriesRef.current) candleSeriesRef.current.setMarkers([]);
      const url = `https://api.mexc.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}`;
      const resp = await fetch(url).then((r) => r.json());
      if (!Array.isArray(resp)) return;
      const mapped: Candle[] = resp.map((c) => ({ t: c[0], o: Number(c[1]), h: Number(c[2]), l: Number(c[3]), c: Number(c[4]), v: Number(c[5]) }));
      const data = mapped.map((b) => ({ time: Math.floor(b.t / 1000), open: b.o, high: b.h, low: b.l, close: b.c }));
      candleSeriesRef.current?.setData(data);
      const vol = mapped.map((b) => ({ time: Math.floor(b.t / 1000), value: b.v, color: b.c >= b.o ? "#26a69a" : "#ef5350" }));
      volumeSeriesRef.current?.setData(vol);
      const closeValues = mapped.map((b) => b.c);
      const times = mapped.map((b) => Math.floor(b.t / 1000));
      if (getIndicatorState("sma5")) sma5SeriesRef.current?.setData(smaCalc(closeValues, 5, times));
      if (getIndicatorState("sma20")) sma20SeriesRef.current?.setData(smaCalc(closeValues, 20, times));
      if (getIndicatorState("ema20")) ema20SeriesRef.current?.setData(emaCalc(closeValues, 20, times));
      if (getIndicatorState("ema50")) ema50SeriesRef.current?.setData(emaCalc(closeValues, 50, times));
      if (getIndicatorState("bb")) { const bb = bollingerBands(closeValues, 20, times); bbUpperSeries.current?.setData(bb.upper); bbMiddleSeries.current?.setData(bb.middle); bbLowerSeries.current?.setData(bb.lower); }
      if (getIndicatorState("rsi")) rsiSeries.current?.setData(rsiCalc(closeValues, times));
    } catch (e) { console.warn("History load error", e); }
  };

  useEffect(() => { if (ready) loadHistory(); }, [ready, symbol, interval]);

  useEffect(() => {
    if (!ready || BLOCK_WS) return;
    wsRef.current?.close();
    const url = "wss://wbs.mexc.com/ws";
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ method: "SUBSCRIPTION", params: [`spot@public.kline.v3.api@${symbol}@${interval}`,`spot@public.deal.v3.api@${symbol}`] }));
    };
    ws.onmessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.c?.includes("kline")) {
          const c = msg.d.candle;
          const last = { time: Math.floor(c.t / 1000), open: Number(c.o), high: Number(c.h), low: Number(c.l), close: Number(c.c) };
          candleSeriesRef.current?.update(last);
          lastPriceRef.current = last.close;
          volumeSeriesRef.current?.update({ time: last.time, value: Number(c.v), color: last.close >= last.open ? "#26a69a" : "#ef5350" });
          
          renderOrderLines();
          if (bracketRef.current.active) {
            renderBracketLines();
          }
          drawOverlays(last.close);
          renderPositionOverlay(last.close);
        }
        if (msg.c?.includes("deal.v3.api")) {
          if (Array.isArray(msg.d?.deals)) {
            msg.d.deals.forEach((t: any) => pushTradeMarker({ p: Number(t.p), T: Number(t.t), m: t.S === 2, v: Number(t.v) }));
          }
        }
      } catch (_) {}
    };
    return () => wsRef.current?.close();
  }, [ready, symbol, interval, BLOCK_WS]);

  return <div ref={containerRef} className="w-full h-full relative" />;
});

ChartEngine.displayName = "ChartEngine";
export default ChartEngine;

    