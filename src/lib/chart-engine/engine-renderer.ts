// src/lib/chart-engine/engine-renderer.ts
// PART 13.7-A (2/4)
// Hybrid Chart Engine Rendering Layer (Fort Knox Exchange)

import {
  createChart,
  IChartApi,
  ISeriesApi,
  DeepPartial,
  ChartOptions,
  CrosshairMode,
  Time,
} from "lightweight-charts";

import {
  CHART_COLORS,
  Candle,
  ChartEngine,
  applyAdaptiveScaling,
} from "./engine-core";

// -------------------------------------------------
// Lightweight-Chart Options (Fort Knox Theme)
// -------------------------------------------------
export function getChartOptions(height: number): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: { color: CHART_COLORS.background },
      textColor: CHART_COLORS.textPrimary,
      fontFamily: "Inter, sans-serif",
    },
    grid: {
      horzLines: { color: CHART_COLORS.gridLine },
      vertLines: { color: CHART_COLORS.gridLine },
    },
    rightPriceScale: {
      borderColor: CHART_COLORS.gridLine,
      visible: true,
      autoScale: true,
    },
    timeScale: {
      borderColor: CHART_COLORS.gridLine,
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 10,
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: CHART_COLORS.neonBlueDim },
      horzLine: { color: CHART_COLORS.neonBlueDim },
    },
    height,
  };
}

// -------------------------------------------------
// Series Creation Utilities
// -------------------------------------------------
export function createCandleSeries(chart: IChartApi) {
  return chart.addCandlestickSeries({
    upColor: CHART_COLORS.upCandle,
    downColor: CHART_COLORS.downCandle,
    wickUpColor: CHART_COLORS.upCandle,
    wickDownColor: CHART_COLORS.downCandle,
    borderDownColor: CHART_COLORS.downCandle,
    borderUpColor: CHART_COLORS.upCandle,
  });
}

export function createVolumeSeries(chart: IChartApi) {
  return chart.addHistogramSeries({
    color: CHART_COLORS.neonBlueDim,
    priceFormat: { type: "volume" },
  });
}

// -------------------------------------------------
// Convert Candle → Lightweight Format
// -------------------------------------------------
function toLWCandle(c: Candle) {
  return {
    time: Math.floor(c.t / 1000) as Time,
    open: c.o,
    high: c.h,
    low: c.l,
    close: c.c,
  };
}

function toLWVolume(c: Candle) {
  return {
    time: Math.floor(c.t / 1000) as Time,
    value: c.v,
    color: c.c >= c.o ? CHART_COLORS.upCandle : CHART_COLORS.downCandle,
  };
}

// -------------------------------------------------
// Renderer Layer — Attaches Chart to Engine
// -------------------------------------------------
export class ChartEngineRenderer {
  core: ChartEngine;
  chart: IChartApi | null = null;

  candleSeries: ISeriesApi<"Candlestick"> | null = null;
  volumeSeries: ISeriesApi<"Histogram"> | null = null;

  constructor(core: ChartEngine) {
    this.core = core;
  }

  // ---------------------------------------------
  // Initialize Chart Instance
  // ---------------------------------------------
  init(container: HTMLElement) {
    if (!container) return;

    const height = Math.floor(window.innerHeight * 0.55);

    const chart = createChart(container, getChartOptions(height));
    this.chart = chart;
    this.core.chart = chart;

    // adaptive scaling
    applyAdaptiveScaling(container, chart);

    // series
    this.candleSeries = createCandleSeries(chart);
    this.volumeSeries = createVolumeSeries(chart);

    // subscribe to core events
    this.bindCoreEvents();
  }

  // ---------------------------------------------
  // Listen to Core Engine Events
  // ---------------------------------------------
  bindCoreEvents() {
    // candles updated
    this.core.eventBus.on("candles-updated", (candles: Candle[]) => {
      if (!this.candleSeries || !this.volumeSeries) return;

      const lw = candles.map(toLWCandle);
      const vol = candles.map(toLWVolume);

      this.candleSeries.setData(lw);
      this.volumeSeries.setData(vol);
    });

    // individual trade markers → later
    // depth updates → overlay engine
    // MTF updates → mtf engine
  }

  // ---------------------------------------------
  // Update Last Candle in Real-Time
  // ---------------------------------------------
  updateLastCandle(c: Candle) {
    if (!this.candleSeries || !this.volumeSeries) return;

    const lw = toLWCandle(c);
    const vol = toLWVolume(c);

    this.candleSeries.update(lw);
    this.volumeSeries.update(vol);
  }

  // ---------------------------------------------
  // Programmatic Zoom Helpers
  // ---------------------------------------------
  zoomIn() {
    // this.chart?.timeScale().zoomIn(); // Not available in lightweight-charts v4
  }

  zoomOut() {
    // this.chart?.timeScale().zoomOut(); // Not available in lightweight-charts v4
  }

  resetZoom() {
    this.chart?.timeScale().fitContent();
  }

  // ---------------------------------------------
  // Dispose Chart
  // ---------------------------------------------
  destroy() {
    try {
      this.chart?.remove();
    } catch { }
    this.chart = null;
  }
}
