// src/lib/chart-engine/engine-overlay.ts
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
export class ChartEngineOverlay {
  core: ChartEngine;

  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  container: HTMLElement | null = null;

  width = 0;
  height = 0;
  dpi = window.devicePixelRatio || 1;

  constructor(core: ChartEngine) {
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
  // Redraw full overlay
  // -----------------------------------------------------
  redraw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.width, this.height);

    const depthInternal = this.core.depthInternal;
    const depthExternal = this.core.depthExternal;

    if (!depthInternal) return; // nothing to render yet

    // Draw internal depth heatmap
    this.drawDepth(depthInternal, CHART_COLORS.internalDepthFill);

    // Draw MEXC depth overlay (thin & transparent)
    if (depthExternal) {
      this.drawDepth(depthExternal, CHART_COLORS.externalDepthFill);
    }

    // Draw mid-price line
    this.drawMidPrice();
  }

  // -----------------------------------------------------
  // Draw mid-price line
  // -----------------------------------------------------
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

    const y = this.core.candleSeries?.priceToCoordinate(mid);
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
    return this.core.candleSeries?.priceToCoordinate(price) ?? null;
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
