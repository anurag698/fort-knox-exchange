// src/components/trade/chart/chart-toolbar.tsx
"use client";

import React from "react";

export default function ChartToolbar({ engineApi }: { engineApi?: any }) {
  const ui = engineApi ?? (typeof window !== "undefined" && (window as any).__FK_CHART__?.engine?.ui);

  return (
    <div className="chart-toolbar" style={{ display: "flex", gap: 8 }}>
      <button onClick={() => ui?.zoomIn?.()} aria-label="zoom in">＋</button>
      <button onClick={() => ui?.zoomOut?.()} aria-label="zoom out">－</button>
      <button onClick={() => ui?.resetZoom?.()} aria-label="reset">Reset</button>
      <button onClick={() => ui?.addSMA?.(20)} aria-label="sma20">SMA20</button>
      <button onClick={() => ui?.addEMA?.(20)} aria-label="ema20">EMA20</button>
      <button onClick={() => ui?.addRSI?.(14)} aria-label="rsi">RSI</button>
      <button onClick={() => ui?.enableTrendTool?.()} aria-label="trend">Trend</button>
    </div>
  );
}
