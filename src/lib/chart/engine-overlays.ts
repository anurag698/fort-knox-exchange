/* -----------------------------------------------------------
   PART 13.7-A (4/4)
   FINAL — Overlay utilities, cleanup helpers, color schemes,
   marker management, canvas scaling, safe guards,
   and public API exports.
------------------------------------------------------------*/

/* -----------------------------------------------------------
   GLOBAL COLOR PALETTE (Fort Knox Hybrid Blue + Gold)
------------------------------------------------------------*/
export const FK_COLORS = {
  buy: "#1ddf8f",
  sell: "#ff5572",
  tp: "#00d4ff",
  sl: "#ff4d4d",
  pos: "#ffc843",
  line: "#92a3b3",
  grid: "rgba(255,255,255,0.08)",

  draw: {
    free: "#ffffff",
    fib: "#ffe680",
    trend: "#9db4ff",
  },
};

/* -----------------------------------------------------------
    SMART THROTTLE — prevents flooding chart with updates
------------------------------------------------------------*/
export function throttle(fn: (...args: any[]) => void, limit = 12) {
  let waiting = false;
  return (...args: any[]) => {
    if (!waiting) {
      fn(...args);
      waiting = true;
      setTimeout(() => (waiting = false), limit);
    }
  };
}

/* -----------------------------------------------------------
   CANVAS DPI FIX — ensures crisp overlays on all screens
------------------------------------------------------------*/
export function scaleCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.scale(dpr, dpr);

  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
}

/* -----------------------------------------------------------
   SAFE CLEAR
------------------------------------------------------------*/
export function clearCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
}

/* -----------------------------------------------------------
   HELPER: Convert price → Y pixel
------------------------------------------------------------*/
export function priceToY(chart: any, price: number): number {
  if (!chart) return 0;
  return chart.priceScale("right").priceToCoordinate(price) ?? 0;
}

/* -----------------------------------------------------------
   HELPER: Convert time → X pixel
------------------------------------------------------------*/
export function timeToX(chart: any, t: number): number {
  if (!chart) return 0;
  return chart.timeScale().timeToCoordinate(t) ?? 0;
}

/* -----------------------------------------------------------
   TRADE MARKER SIZING
------------------------------------------------------------*/
export function getMarkerSize(canvas: HTMLCanvasElement) {
  const w = canvas.getBoundingClientRect().width;
  if (w > 1600) return 8;
  if (w > 1200) return 7;
  return 6;
}

// Dummy types for Overlay objects - will be defined properly later
type OverlayPoint = { time: number; price: number };
class OverlayFreeDraw { constructor(public points: OverlayPoint[], public color: string) {} }
class OverlayTrend { constructor(public p1: OverlayPoint, public p2: OverlayPoint, public color: string) {} }
class OverlayFib { constructor(public high: OverlayPoint, public low: OverlayPoint, public color: string) {} }
type OverlayPosition = any;
type OverlayTPSL = any;
type OverlayEntry = any;
type OverlayTradeMarker = any;

/* -----------------------------------------------------------
   DRAWER REGISTRY — Store active drawings per chart instance
------------------------------------------------------------*/
export const DRAW_REGISTRY: Record<
  string,
  {
    free: OverlayFreeDraw[];
    trend: OverlayTrend[];
    fib: OverlayFib[];
  }
> = {};

// Dummy registries for other overlay types
const ACTIVE_POSITION: Record<string, any> = {};
const ACTIVE_TPSL: Record<string, any[]> = {};
const ACTIVE_ENTRIES: Record<string, any[]> = {};
const ACTIVE_MARKERS: Record<string, any[]> = {};
const ACTIVE_DEPTH: Record<string, any> = {};


// Dummy drawing functions - to be implemented
function drawDepthOverlay(chart: any, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, data: any) {}
function drawTrendLine(chart: any, ctx: CanvasRenderingContext2D, trend: OverlayTrend) {}
function drawFreeLine(chart: any, ctx: CanvasRenderingContext2D, freeDraw: OverlayFreeDraw) {}
function drawFib(chart: any, ctx: CanvasRenderingContext2D, fib: OverlayFib) {}
function drawEntryLine(chart: any, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, entry: OverlayEntry) {}
function drawPositionOverlay(chart: any, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, position: OverlayPosition) {}
function drawTPSL(chart: any, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, tpsl: OverlayTPSL) {}
function drawTradeMarker(chart: any, ctx: CanvasRenderingContext2D, marker: OverlayTradeMarker, size: number) {}


/* -----------------------------------------------------------
   INIT REGISTRY
------------------------------------------------------------*/
export function initDrawRegistry(chartId: string) {
  if (!DRAW_REGISTRY[chartId]) {
    DRAW_REGISTRY[chartId] = {
      free: [],
      trend: [],
      fib: [],
    };
  }
}

/* -----------------------------------------------------------
   PUBLIC API — for your chart-engine.tsx to call
------------------------------------------------------------*/

export const OverlaysAPI = {
  /* ---------------------------------------------------------
     FREE DRAW
  ---------------------------------------------------------*/
  addFreeDraw: (
    chartId: string,
    points: OverlayPoint[],
    color = FK_COLORS.draw.free
  ): OverlayFreeDraw => {
    const obj = new OverlayFreeDraw(points, color);
    DRAW_REGISTRY[chartId].free.push(obj);
    return obj;
  },

  /* ---------------------------------------------------------
     TREND LINES
  ---------------------------------------------------------*/
  addTrend: (
    chartId: string,
    p1: OverlayPoint,
    p2: OverlayPoint,
    color = FK_COLORS.draw.trend
  ) => {
    const obj = new OverlayTrend(p1, p2, color);
    DRAW_REGISTRY[chartId].trend.push(obj);
    return obj;
  },

  /* ---------------------------------------------------------
     FIB LEVELS
  ---------------------------------------------------------*/
  addFib: (
    chartId: string,
    high: OverlayPoint,
    low: OverlayPoint,
    color = FK_COLORS.draw.fib
  ) => {
    const obj = new OverlayFib(high, low, color);
    DRAW_REGISTRY[chartId].fib.push(obj);
    return obj;
  },

  /* ---------------------------------------------------------
     POSITION OVERLAYS (TP/SL)
  ---------------------------------------------------------*/
  setPositionOverlay: (chartId: string, pos: OverlayPosition | null) => {
    ACTIVE_POSITION[chartId] = pos;
  },

  addTPSL: (chartId: string, item: OverlayTPSL) => {
    if (!ACTIVE_TPSL[chartId]) ACTIVE_TPSL[chartId] = [];
    ACTIVE_TPSL[chartId].push(item);
  },

  setTPSL: (chartId: string, list: OverlayTPSL[]) => {
    ACTIVE_TPSL[chartId] = list;
  },

  /* ---------------------------------------------------------
     MULTI-ENTRY SUPPORT
  ---------------------------------------------------------*/
  setEntries: (chartId: string, list: OverlayEntry[]) => {
    ACTIVE_ENTRIES[chartId] = list;
  },

  /* ---------------------------------------------------------
     TRADE MARKERS
  ---------------------------------------------------------*/
  setTradeMarkers: (chartId: string, list: OverlayTradeMarker[]) => {
    ACTIVE_MARKERS[chartId] = list;
  },

  /* ---------------------------------------------------------
     DEPTH HEATMAP
  ---------------------------------------------------------*/
  setDepth: (chartId: string, bids: any[], asks: any[], mid: number) => {
    ACTIVE_DEPTH[chartId] = { bids, asks, mid };
  },

  /* ---------------------------------------------------------
     DRAW EVERYTHING
  ---------------------------------------------------------*/
  renderAll: (
    chartId: string,
    chart: any,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    if (!canvas || !ctx || !chart) return;

    scaleCanvas(canvas, ctx);
    clearCanvas(canvas, ctx);

    const reg = DRAW_REGISTRY[chartId] ?? null;

    if (!reg) return;

    // Depth
    if (ACTIVE_DEPTH[chartId]) {
      drawDepthOverlay(chart, canvas, ctx, ACTIVE_DEPTH[chartId]);
    }

    // Trend lines
    reg.trend.forEach((t) => drawTrendLine(chart, ctx, t));

    // Free draw
    reg.free.forEach((f) => drawFreeLine(chart, ctx, f));

    // Fib levels
    reg.fib.forEach((fib) => drawFib(chart, ctx, fib));

    // Multi entries
    if (ACTIVE_ENTRIES[chartId]) {
      ACTIVE_ENTRIES[chartId].forEach((e) => drawEntryLine(chart, canvas, ctx, e));
    }

    // Position overlay
    if (ACTIVE_POSITION[chartId]) {
      drawPositionOverlay(chart, canvas, ctx, ACTIVE_POSITION[chartId]);
    }

    // TP/SL lines
    if (ACTIVE_TPSL[chartId]) {
      ACTIVE_TPSL[chartId].forEach((x) => drawTPSL(chart, canvas, ctx, x));
    }

    // Trade markers (buy/sell arrows)
    if (ACTIVE_MARKERS[chartId]) {
      const size = getMarkerSize(canvas);
      ACTIVE_MARKERS[chartId].forEach((m) => drawTradeMarker(chart, ctx, m, size));
    }
  },
};

/* -----------------------------------------------------------
   DONE — END OF FILE (13.7-A 4/4)
------------------------------------------------------------*/
