// src/lib/chart-engine/engine-overlays.ts
// PART 13.7-A (3/4)
// Canvas Depth Overlay Engine (Fort Knox Exchange)

import {
  CHART_COLORS,
  DepthLevel,
  OrderbookSnapshot,
  DepthOverlaySnapshot,
  ChartEngine,
} from "./engine-core";

/**
 * This class renders the hybrid depth heatmap and overlays:
 * - Internal FKX depth (gold)
 * - External MEXC depth (neon blue transparent)
 * - Mid-price line
 * - Walls heat intensity
 */
export class OverlayManager {
  core: ChartEngine;
  chart: IChartApi; // Store chart reference directly

  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  container: HTMLElement | null = null;

  width = 0;
  height = 0;
  dpi = window.devicePixelRatio || 1;

  constructor(chart: IChartApi, core: ChartEngine) {
    this.chart = chart; // Store the chart reference!
    this.core = core;
  }

  // -----------------------------------------------------
  // Initialize canvas overlay
  // -----------------------------------------------------
  init(container: HTMLElement) {
    this.container = container;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "5";
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    container.appendChild(canvas);

    this.resize();
    new ResizeObserver(() => this.resize()).observe(container);

    // Bind core events
    this.core.eventBus.on("internal-depth", () => this.redraw());
    this.core.eventBus.on("external-depth", () => this.redraw());
    this.core.eventBus.on("candles-updated", () => this.redraw());
    this.core.eventBus.on("drawing-update", () => this.redraw());
  }

  // -----------------------------------------------------
  // Resize canvas (adaptive scaling)
  // -----------------------------------------------------
  resize() {
    if (!this.canvas || !this.container) return;

    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpi;
    this.canvas.height = this.height * this.dpi;

    if (this.ctx) {
      this.ctx.scale(this.dpi, this.dpi);
    }

    this.redraw();
  }

  // -----------------------------------------------------
  // State for Overlays
  // -----------------------------------------------------
  private tpSlLines: { price: number; type: "tp" | "sl" }[] = [];
  private entries: { price: number; size: number }[] = [];
  private tradeMarkers: { price: number; size: number; side: "buy" | "sell"; ts?: number }[] = [];
  private positionOverlay: { avgEntry: number; size: number; pnl: number; side: "long" | "short" } | null = null;

  setTPSL(list: { price: number; type: "tp" | "sl" }[]) {
    this.tpSlLines = list;
    this.redraw();
  }

  setEntries(entries: { price: number; size: number }[]) {
    this.entries = entries;
    this.redraw();
  }

  setTradeMarkers(markers: { price: number; size: number; side: "buy" | "sell"; ts?: number }[]) {
    this.tradeMarkers = markers;
    this.redraw();
  }

  setPositionOverlay(position: { avgEntry: number; size: number; pnl: number; side: "long" | "short" }) {
    this.positionOverlay = position;
    this.redraw();
  }

  setDepth(bids: any[], asks: any[], mid: number) {
    // already handled by core event bus, but exposed for direct calls
    this.core.updateDepthInternal({ bids, asks, ts: Date.now() });
  }

  refreshPositionOverlays() {
    this.redraw();
  }

  // -----------------------------------------------------
  // Redraw full overlay
  // -----------------------------------------------------
  redraw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.width, this.height);

    const depthInternal = this.core.depthInternal;
    const depthExternal = this.core.depthExternal;

    // 1. Draw Depth Heatmaps
    if (depthInternal) {
      this.drawDepth(depthInternal, CHART_COLORS.internalDepthFill);
    }
    if (depthExternal) {
      this.drawDepth(depthExternal, CHART_COLORS.externalDepthFill);
    }

    // 2. Draw Mid Price
    this.drawMidPrice();

    // 3. Draw Entries & Position
    this.drawEntries();
    this.drawPositionOverlay();

    // 4. Draw TP/SL
    this.drawTPSL();

    // 5. Draw Trade Markers
    this.drawTradeMarkers();

    // 6. Draw User Drawings
    this.drawDrawings();
  }

  // ... existing drawMidPrice ...

  // -----------------------------------------------------
  // Draw User Drawings (Trend, Fib)
  // -----------------------------------------------------
  drawDrawings() {
    if (!this.ctx || !this.core.chart) return;
    const ctx = this.ctx;
    const drawings = this.core.drawings;
    const selectedIndex = this.core.selectedDrawingIndex;
    const hoveredIndex = this.core.hoveredDrawingIndex;

    drawings.forEach((d, i) => {
      const isSelected = i === selectedIndex;
      const isHovered = i === hoveredIndex && !isSelected;

      if (d.type === 'trend') {
        this.drawTrendLine(d.p1, d.p2, isSelected, isHovered);
      } else if (d.type === 'ray') {
        this.drawRay(d.p1, d.p2, isSelected, isHovered);
      } else if (d.type === 'measure') {
        this.drawMeasure(d.p1, d.p2, isSelected, isHovered);
      } else if (d.type === 'fib') {
        this.drawFib(d.high || d.p1, d.low || d.p2, isSelected, isHovered);
      } else if (d.type === 'horizontal') {
        this.drawHorizontalLine(d.price, isSelected, isHovered);
      }
    });
  }

  drawHorizontalLine(price: number, isSelected = false, isHovered = false) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const y = this.priceToY(price);
    if (y === null) return;

    // Hover Effect
    if (isHovered) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'; // Faint blue halo
      ctx.lineWidth = 6;
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = isSelected ? '#60a5fa' : (isHovered ? '#60a5fa' : '#3b82f6');
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.setLineDash([5, 5]); // Dashed for horizontal
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Draw handle if selected
    if (isSelected) {
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.arc(this.width - 20, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  drawRay(p1: any, p2: any, isSelected = false, isHovered = false) {
    if (!this.ctx || !p1 || !p2 || !this.chart) return;
    const ctx = this.ctx;
    const chart = this.chart;

    const x1 = chart.timeScale().timeToCoordinate(p1.time);
    const y1 = this.priceToY(p1.price);
    const x2 = chart.timeScale().timeToCoordinate(p2.time);
    const y2 = this.priceToY(p2.price);

    if (x1 === null || y1 === null || x2 === null || y2 === null) return;

    // Calculate extension
    // y = mx + c
    // m = (y2 - y1) / (x2 - x1)

    let endX = this.width;
    let endY = y2;

    if (x2 !== x1) {
      const m = (y2 - y1) / (x2 - x1);
      const c = y1 - m * x1;

      // If ray points left, we go to 0, if right we go to width
      // But "Ray" usually means from p1 through p2 to infinity
      // So direction depends on p2 relative to p1

      if (x2 >= x1) {
        endX = this.width;
      } else {
        endX = 0;
      }

      endY = m * endX + c;
    } else {
      // Vertical line
      endX = x1;
      endY = y2 > y1 ? this.height : 0;
    }

    // Cast to any for Coordinate type compatibility
    const ex = endX as any;
    const ey = endY as any;

    // Draw Ray Line
    // We draw segment p1->p2 normally (for handles) + extension p2->end

    // Draw selection halo
    if (isSelected) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'; // Blue halo
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.moveTo(x1, y1);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    } else if (isHovered) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'; // Faint blue halo
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.moveTo(x1, y1);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6'; // Blue
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // Draw handles
    if (isSelected) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;

      // Shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      // Assuming 'd' refers to the drawing object passed to drawDrawings,
      // and p1/p2 are the points of the current ray.
      // The original code used x1, y1, ex, ey which are derived from p1, p2.
      // We'll use the already calculated x1, y1, ex, ey for the handles.
      // The provided snippet uses `d.p1`, `d.p2`, `this.chart`, `this.engine.candleSeries`
      // which suggests a more generic handle drawing function.
      // For this specific `drawRay` function, we should use the local `x1, y1, ex, ey`.

      // P1 Handle
      ctx.beginPath();
      ctx.arc(x1, y1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // P2 Handle (at the end of the ray)
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  drawTrendLine(p1: any, p2: any, isSelected = false, isHovered = false) {
    if (!this.ctx || !p1 || !p2) return;
    const ctx = this.ctx;

    // Convert time to X is hard without timeScale API
    // We need timeToCoordinate which is available on timeScale()
    const chart = this.core.chart;
    if (!chart) return;

    const x1 = chart.timeScale().timeToCoordinate(p1.time);
    const y1 = this.priceToY(p1.price);
    const x2 = chart.timeScale().timeToCoordinate(p2.time);
    const y2 = this.priceToY(p2.price);

    if (x1 === null || y1 === null || x2 === null || y2 === null) return;

    // Draw selection halo
    if (isSelected) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'; // Blue halo
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (isHovered) {
      // Hover halo
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'; // Faint blue halo
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6'; // Blue
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw handles if selected
    if (isSelected) {
      [
        { x: x1, y: y1 },
        { x: x2, y: y2 }
      ].forEach(pt => {
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fill();
      });
    }
  }

  drawMeasure(p1: any, p2: any, isSelected = false, isHovered = false) {
    // Early exit if essential dependencies aren't ready
    if (!this.ctx || !p1 || !p2 || !this.chart) {
      return;
    }

    const ctx = this.ctx;
    const chart = this.chart;

    const x1 = chart.timeScale().timeToCoordinate(p1.time as any);
    const y1 = this.priceToY(p1.price);
    const x2 = chart.timeScale().timeToCoordinate(p2.time as any);
    const y2 = this.priceToY(p2.price);

    if (x1 === null || y1 === null || x2 === null || y2 === null) return;

    // Draw Box
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Blue tint
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const width = x2 - x1;
    const height = y2 - y1;

    ctx.fillRect(x1, y1, width, height);
    ctx.strokeRect(x1, y1, width, height);

    // Draw Arrow Line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Calculate Metrics
    const priceDiff = p2.price - p1.price;
    const pricePct = (priceDiff / p1.price) * 100;

    const text = `${priceDiff.toFixed(2)} (${pricePct.toFixed(2)}%)`;

    // Draw Label Box
    ctx.font = '12px sans-serif';
    const textMetrics = ctx.measureText(text);
    const padding = 6;
    const boxW = textMetrics.width + padding * 2;
    const boxH = 24;

    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;

    ctx.fillStyle = '#1e293b'; // Dark background
    ctx.beginPath();
    ctx.roundRect(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, centerX, centerY);

    // Draw handles if selected
    if (isSelected) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      ctx.beginPath();
      ctx.arc(x1, y1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x2, y2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  drawFib(p1: any, p2: any, isSelected = false, isHovered = false) {
    if (!this.ctx || !p1 || !p2) return;
    const ctx = this.ctx;
    const chart = this.core.chart;
    if (!chart) return;

    const x1 = chart.timeScale().timeToCoordinate(p1.time);
    const y1 = this.priceToY(p1.price);
    const x2 = chart.timeScale().timeToCoordinate(p2.time);
    const y2 = this.priceToY(p2.price);

    if (x1 === null || y1 === null || x2 === null || y2 === null) return;

    // Draw main diagonal line (trend line style)
    this.drawTrendLine(p1, p2, isSelected, isHovered);

    // Calculate levels
    const diff = p2.price - p1.price;
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const colors = [
      '#787b86', // 0
      '#f44336', // 0.236
      '#ff9800', // 0.382
      '#4caf50', // 0.5
      '#2196f3', // 0.618
      '#9c27b0', // 0.786
      '#787b86'  // 1
    ];

    // Determine X range for levels
    // Standard Fib extends to the right, but let's keep it between x1 and x2 for now,
    // or maybe extend slightly? Let's stick to the width defined by p1 and p2 x-coords.
    // Actually, standard behavior is width of the trend line.
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    const width = endX - startX;

    // Draw Background Fills
    // We iterate levels and fill between current and next
    for (let i = 0; i < levels.length - 1; i++) {
      const lvl1 = levels[i];
      const lvl2 = levels[i + 1];
      const price1 = p1.price + (diff * lvl1);
      const price2 = p1.price + (diff * lvl2);

      const y_1 = this.priceToY(price1);
      const y_2 = this.priceToY(price2);

      if (y_1 !== null && y_2 !== null) {
        ctx.beginPath();
        // Use the color of the level, but very transparent
        const color = colors[i + 1]; // Use the "upper" level color for the band
        // Convert hex to rgba with low opacity
        ctx.fillStyle = this.injectAlpha(color, 0.1);
        ctx.fillRect(startX, Math.min(y_1, y_2), width, Math.abs(y_1 - y_2));
      }
    }

    levels.forEach((level, i) => {
      const price = p1.price + (diff * level);
      const y = this.priceToY(price);
      if (y === null) return;

      // Draw Level Line
      ctx.beginPath();
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1;
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();

      // Draw Label
      ctx.fillStyle = colors[i];
      ctx.font = '10px sans-serif';
      ctx.fillText(`${level} (${price.toFixed(2)})`, startX + 5, y - 2);

      // Optional: Fill between levels? 
      // Can be complex to look good. Let's stick to lines for clarity first.
    });
  }

  // -----------------------------------------------------
  // Draw TP/SL Lines
  // -----------------------------------------------------
  drawTPSL() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.tpSlLines.forEach(line => {
      const y = this.priceToY(line.price);
      if (y === null) return;

      ctx.beginPath();
      ctx.strokeStyle = line.type === 'tp' ? '#00e676' : '#ff5252';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = line.type === 'tp' ? '#00e676' : '#ff5252';
      ctx.font = '10px sans-serif';
      ctx.fillText(line.type.toUpperCase(), this.width - 30, y - 4);
    });
  }

  // -----------------------------------------------------
  // Draw Entries
  // -----------------------------------------------------
  drawEntries() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.entries.forEach(entry => {
      const y = this.priceToY(entry.price);
      if (y === null) return;

      ctx.beginPath();
      ctx.strokeStyle = '#fbbf24'; // Amber
      ctx.lineWidth = 1;
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fbbf24';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Entry: ${entry.size}`, this.width - 60, y - 4);
    });
  }

  // -----------------------------------------------------
  // Draw Position Overlay (PnL)
  // -----------------------------------------------------
  drawPositionOverlay() {
    if (!this.ctx || !this.positionOverlay) return;
    const ctx = this.ctx;
    const { avgEntry, pnl, side } = this.positionOverlay;

    const y = this.priceToY(avgEntry);
    if (y === null) return;

    const color = pnl >= 0 ? '#00e676' : '#ff5252';

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();

    // Draw PnL Badge
    const text = `PnL: ${pnl.toFixed(2)}`;
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = color;
    ctx.fillRect(this.width - textWidth - 10, y - 20, textWidth + 10, 20);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(text, this.width - textWidth - 5, y - 6);
  }

  // -----------------------------------------------------
  // Draw Trade Markers (Bubbles)
  // -----------------------------------------------------
  drawTradeMarkers() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.tradeMarkers.forEach(marker => {
      const y = this.priceToY(marker.price);
      // Need X coordinate based on time... 
      // Canvas overlay doesn't easily map time to X without accessing chart time scale
      // For now, we'll draw them on the right axis or skip if we can't map time

      // Actually, trade markers usually appear at the current time (right side)
      // or we need to map marker.ts to x coordinate.

      if (y === null) return;

      // Simplified: Draw on right side for recent trades
      const x = this.width - 20;

      ctx.beginPath();
      ctx.fillStyle = marker.side === 'buy' ? '#00e676' : '#ff5252';
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // -----------------------------------------------------
  // Draw mid-price line
  // -----------------------------------------------------
  drawMidPrice() {
    const ctx = this.ctx;
    if (!ctx) return;

    const c = this.core.candles;
    if (!c || c.length === 0) return;

    const last = c[c.length - 1];
    const mid = last.c;

    const y = this.priceToY(mid);
    if (y == null) return;

    ctx.strokeStyle = CHART_COLORS.neonBlueDim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();
  }

  // -----------------------------------------------------
  // Convert price to Y coordinate via LC API
  // -----------------------------------------------------
  priceToY(price: number) {
    const series = this.core.candleSeries;
    if (!series) return null;
    return series.priceToCoordinate(price);
  }

  // -----------------------------------------------------
  // Depth Heatmap Drawer (internal + external)
  // -----------------------------------------------------
  drawDepth(snapshot: OrderbookSnapshot | DepthOverlaySnapshot, color: string) {
    if (!this.ctx || !this.core.chart) return;

    const ctx = this.ctx;
    const { bids, asks } = snapshot;

    // Bids (below mid)
    bids.forEach((lvl) => this.drawDepthLevel(lvl, color));

    // Asks (above mid)
    asks.forEach((lvl) => this.drawDepthLevel(lvl, color));
  }

  // -----------------------------------------------------
  // Draw single depth level (price + size)
  // -----------------------------------------------------
  drawDepthLevel(lvl: DepthLevel, fillColor: string) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const y = this.priceToY(lvl.price);
    if (y == null) return;

    const intensity = this.normalizeIntensity(lvl.size);
    if (intensity <= 0) return;

    const h = Math.max(1, 6 - intensity * 3); // thickness varies subtly
    const alpha = Math.min(0.35, intensity * 0.25);

    ctx.fillStyle = this.injectAlpha(fillColor, alpha);
    ctx.fillRect(0, y - h / 2, this.width, h);
  }

  // -----------------------------------------------------
  // Normalize depth intensity per snapshot
  // -----------------------------------------------------
  normalizeIntensity(size: number) {
    const internal = this.core.depthInternal;
    if (!internal) return 0;

    const all = [...internal.bids, ...internal.asks].map((l) => l.size);
    const max = Math.max(...all, 1);

    return size / max;
  }

  // -----------------------------------------------------
  // Inject dynamic alpha to rgba() strings
  // -----------------------------------------------------
  injectAlpha(color: string, alpha: number): string {
    if (color.startsWith("rgba")) {
      return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)/, (_, r, g, b) => {
        return `rgba(${r},${g},${b},${alpha})`;
      });
    }
    if (color.startsWith("#")) {
      // Convert hex to rgba
      const r = parseInt(color.substring(1, 3), 16);
      const g = parseInt(color.substring(3, 5), 16);
      const b = parseInt(color.substring(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
  }

  // -----------------------------------------------------
  // Cleanup
  // -----------------------------------------------------
  destroy() {
    try {
      this.canvas?.remove();
    } catch { }
    this.canvas = null;
    this.ctx = null;
  }
}

import type { IChartApi } from "lightweight-charts";
