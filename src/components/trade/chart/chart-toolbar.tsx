
// src/components/trade/chart/chart-toolbar.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

export default function ChartToolbar({
  engineApi,
}: {
  engineApi?: any; // engine.ui passed from parent via onEngineReady
}) {
  // fallback to window debug chart object (dev only)
  const ui = engineApi ?? (typeof window !== "undefined" && (window as any).__FK_CHART__?.engine?.ui);

  return (
    <div className="chart-toolbar" style={{ display: "flex", gap: 8 }}>
      <button onClick={() => ui?.zoomIn?.()} className="toolbar-btn">+</button>
      <button onClick={() => ui?.zoomOut?.()} className="toolbar-btn">-</button>
      <button onClick={() => ui?.addSMA?.(20)} className="toolbar-btn">SMA20</button>
      <button onClick={() => ui?.addEMA?.(50)} className="toolbar-btn">EMA50</button>
      <button onClick={() => ui?.addRSI?.(14)} className="toolbar-btn">RSI</button>
      <button onClick={() => ui?.enableTrendTool?.()} className="toolbar-btn">Trend</button>
      <button onClick={() => ui?.clearDrawings?.()} className="toolbar-btn">Clear</button>
    </div>
  );
}
