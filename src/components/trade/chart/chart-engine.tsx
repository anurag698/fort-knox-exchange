
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, IChartApi } from "lightweight-charts";

// Engine modules (from Part 13.7-A)
import { ChartEngineCore as ChartEngine } from "@/lib/chart-engine/engine-core";
import { IndicatorManager } from "@/lib/chart-engine/engine-indicators";
import { DrawingManager } from "@/lib/chart-engine/engine-drawings";
import { ChartEngineOverlay as OverlayManager } from "@/lib/chart-engine/engine-overlay";

interface ChartEngineProps {
  symbol: string;        // e.g. BTCUSDT
  interval: string;      // e.g. 1m, 5m, 15m
  height?: number;       // Chart height
  onEngineReady?: (api: {
    chart: IChartApi;
    engine: ChartEngine;
    indicators: IndicatorManager;
    drawings: DrawingManager;
    overlays: OverlayManager;
  }) => void;
}

export default function ChartEngineComponent({
  symbol,
  interval,
  height = 600,
  onEngineReady,
}: ChartEngineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Chart / Engine refs
  const chartRef = useRef<IChartApi | null>(null);
  const engineRef = useRef<ChartEngine | null>(null);
  const indicatorsRef = useRef<IndicatorManager | null>(null);
  const drawingsRef = useRef<DrawingManager | null>(null);
  const overlaysRef = useRef<OverlayManager | null>(null);

  // Theme adaptation
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Resize observer attached to container
  const resizeObserver = useRef<ResizeObserver | null>(null);

  // ------------------------------------------------------------------------
  // INITIAL CHART MOUNT
  // ------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Create LW Chart
    const chart = createChart(container, {
      layout: {
        background: { color: theme === "dark" ? "#01060F" : "#FFFFFF" },
        textColor: theme === "dark" ? "#EBF4FF" : "#101B33",
      },
      grid: {
        vertLines: { color: theme === "dark" ? "#07111D" : "#E1E5EE" },
        horzLines: { color: theme === "dark" ? "#07111D" : "#E1E5EE" },
      },
      width: container.clientWidth,
      height,
      rightPriceScale: {
        borderColor: theme === "dark" ? "#12263F" : "#D5DFEF",
      },
      timeScale: {
        borderColor: theme === "dark" ? "#12263F" : "#D5DFEF",
        rightOffset: 8,
      },
      crosshair: { mode: 1 as any },
    });

    chartRef.current = chart;

    // 2. Engine Instance
    const engine = new ChartEngine(chart);
    engineRef.current = engine;

    // 3. Indicators / Drawings / Overlays Managers
    const indicators = new IndicatorManager(chart, engine);
    const drawings = new DrawingManager(chart, engine);
    const overlays = new OverlayManager(engine);
    overlays.init(container); // Initialize the overlay canvas

    indicatorsRef.current = indicators;
    drawingsRef.current = drawings;
    overlaysRef.current = overlays;

    // 4. Resize Observer
    resizeObserver.current = new ResizeObserver(() => {
      if (!container || !chartRef.current) return;
      chartRef.current.applyOptions({ width: container.clientWidth });
    });
    resizeObserver.current.observe(container);

    // 5. Callback to parent (Toolbar, Shell, Layout)
    onEngineReady?.({
      chart,
      engine,
      indicators,
      drawings,
      overlays,
    });

    return () => {
      // Cleanup
      resizeObserver.current?.disconnect();
      resizeObserver.current = null;

      overlays.destroy();
      
      chart.remove();
      chartRef.current = null;
      engineRef.current = null;
      indicatorsRef.current = null;
      drawingsRef.current = null;
      overlaysRef.current = null;
    };
  }, [theme, height, onEngineReady]);

  // ------------------------------------------------------------------------
  // THEME LISTENER (auto-switch when Fort Knox theme changes)
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const html = document.documentElement;

    const observer = new MutationObserver(() => {
      const isDark = html.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // ------------------------------------------------------------------------
  // CHART CONTAINER
  // ------------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: height,
        position: "relative",
        overflow: "hidden",
      }}
    />
  );
}
