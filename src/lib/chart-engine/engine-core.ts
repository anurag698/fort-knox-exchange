// src/lib/chart-engine/engine-core.ts
// Hybrid Chart Engine Core (Fort Knox Exchange)
// PART 13.7-A (1/4)

// -------------------------
// Imports
// -------------------------
import { createChart, IChartApi, ISeriesApi } from "lightweight-charts";

// Safe, Firebase-friendly event emitter
export class EngineEventBus {
  private listeners: Record<string, ((data?: any) => void)[]> = {};

  on(event: string, cb: (data?: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  off(event: string, cb: (data?: any) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((fn) => fn !== cb);
  }
}

// -------------------------
// Theme System (Gold + Neon Blue)
// -------------------------
export const CHART_COLORS = {
  gold: "#E7C674",
  neonBlue: "#4DC3FF",
  neonBlueDim: "rgba(77,195,255,0.35)",
  goldDim: "rgba(231,198,116,0.35)",
  background: "#08131f",
  gridLine: "rgba(255,255,255,0.05)",
  textPrimary: "#dbeafe",
  textSecondary: "#94a3b8",

  // Candle theme
  upCandle: "#26a69a",
  downCandle: "#ef5350",

  // Overlay + depth
  internalDepthFill: "rgba(231,198,116,0.18)", // gold transparent
  externalDepthFill: "rgba(77,195,255,0.12)", // neon blue transparent
};

// -------------------------
// Timeframes
// -------------------------
export type Timeframe =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "1d";

export const TIMEFRAME_TO_SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "3m": 180,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "2h": 7200,
  "4h": 14400,
  "1d": 86400,
};

// -------------------------
// Candle Model
// -------------------------
export interface Candle {
  t: number; // unix ms
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  final?: boolean;
}

// Lightweight-Charts format
export interface LWCandle {
  time: number; // seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

// -------------------------
// Depth Model (FKX Internal + MEXC External Overlay)
// -------------------------
export interface DepthLevel {
  price: number;
  size: number;
}

export interface OrderbookSnapshot {
  bids: DepthLevel[];
  asks: DepthLevel[];
  ts: number;
}

export interface DepthOverlaySnapshot {
  bids: DepthLevel[];
  asks: DepthLevel[];
  ts: number;
}

// -------------------------
// Trades (for markers)
// -------------------------
export interface Trade {
  price: number;
  size: number;
  side: "buy" | "sell";
  ts: number;
}

// -------------------------
// Position Models (Spot + Futures)
// -------------------------
export interface SpotPosition {
  avgEntry: number;
  size: number; // positive = long, negative = short
  pnl: number;
}

export interface PerpPosition {
  avgEntry: number;
  size: number; // long (+), short (-)
  markPrice: number;
  liqPrice: number;
  pnl: number;
  leverage: number;
  isolated: boolean;
}

// -------------------------
// TP/SL Lines
// -------------------------
export interface TPSLLine {
  price: number;
  type: "tp" | "sl";
  active: boolean;
}

// -------------------------
// Multi-Entry Support
// -------------------------
export interface PositionEntry {
  price: number;
  size: number;
  ts: number;
}

export interface PositionBundle {
  entries: PositionEntry[];
  totalSize: number;
  avgEntry: number;
  pnl: number;
}

// -------------------------
// Multi-Timeframe Buffers
// -------------------------
export interface MTFBuffer {
  timeframe: Timeframe;
  candles: Candle[];
}

export interface MTFState {
  primary: Timeframe;
  overlays: Timeframe[];
  buffers: Record<Timeframe, Candle[]>;
}

// -------------------------
// WebSocket Models
// -------------------------
export interface MEXCKlineMessage {
  c: string;
  d: {
    kline: {
      t: number;
      o: string;
      h: string;
      l: string;
      c: string;
      v: string;
    };
  };
}

export interface FKXDepthMessage {
  type: "depth";
  bids: [number, number][];
  asks: [number, number][];
  ts: number;
}

export interface FKXTradeMessage {
  type: "trade";
  price: number;
  size: number;
  side: "buy" | "sell";
  ts: number;
}

export interface FKXPositionMessage {
  type: "position";
  position: SpotPosition | PerpPosition;
}

export type HybridMessage =
  | MEXCKlineMessage
  | FKXDepthMessage
  | FKXTradeMessage
  | FKXPositionMessage;

// -------------------------
// Adaptive Scaling Utility
// -------------------------
export function applyAdaptiveScaling(
  container: HTMLElement,
  chart: IChartApi
) {
  const resize = () => {
    const width = container.clientWidth;
    if (width < 400) {
      chart.applyOptions({ width, height: Math.floor(window.innerHeight * 0.50) });
    } else if (width < 600) {
      chart.applyOptions({ width, height: Math.floor(window.innerHeight * 0.55) });
    } else {
      chart.applyOptions({ width, height: Math.floor(window.innerHeight * 0.60) });
    }
  };
  resize();
  new ResizeObserver(resize).observe(container);
}

// -------------------------
// Base Chart Engine Class
// -------------------------
export class ChartEngine {
  container: HTMLElement | null = null;
  chart: IChartApi | null = null;
  candleSeries: ISeriesApi<"Candlestick"> | null = null;

  eventBus = new EngineEventBus();

  // Data State
  candles: Candle[] = [];
  depthInternal: OrderbookSnapshot | null = null;
  depthExternal: DepthOverlaySnapshot | null = null;
  trades: Trade[] = [];
  position: SpotPosition | PerpPosition | null = null;
  tpSlLines: TPSLLine[] = [];
  mtf: MTFState = {
    primary: "1m",
    overlays: [],
    buffers: {} as any,
  };

  constructor(chart: IChartApi) {
    this.chart = chart;
  }

  setContainer(el: HTMLElement) {
    this.container = el;
  }

  setPrimaryTimeframe(tf: Timeframe) {
    this.mtf.primary = tf;
  }

  setOverlayTimeframes(tfs: Timeframe[]) {
    this.mtf.overlays = tfs;
  }

  setCandles(c: Candle[]) {
    this.candles = c;
    this.eventBus.emit("candles-updated", c);
  }

  getLastCandle(): Candle | null {
    if (this.candles.length === 0) return null;
    return this.candles[this.candles.length - 1];
  }

  applyRealtimeCandle(c: Candle, interval: string) {
    if (this.mtf.primary !== interval) return; // Ignore updates for other timeframes

    const last = this.getLastCandle();
    
    // If the new candle's timestamp matches the last one, update it.
    if (last && c.t === last.t) {
      this.candles[this.candles.length - 1] = c;
    } else {
      // Otherwise, it's a new candle.
      this.candles.push(c);
    }
    this.eventBus.emit("candles-updated", this.candles);

    if (c.final) {
        this.eventBus.emit("candle-final", c);
    }
  }


  pushTrade(t: Trade) {
    this.trades.push(t);
    this.eventBus.emit("trade", t);
  }

  updateDepthInternal(d: OrderbookSnapshot) {
    this.depthInternal = d;
    this.eventBus.emit("internal-depth", d);
  }

  updateDepthExternal(d: DepthOverlaySnapshot) {
    this.depthExternal = d;
    this.eventBus.emit("external-depth", d);
  }

  updatePosition(p: SpotPosition | PerpPosition) {
    this.position = p;
    this.eventBus.emit("position", p);
  }

  destroy() {
    // any cleanup logic
  }
}
