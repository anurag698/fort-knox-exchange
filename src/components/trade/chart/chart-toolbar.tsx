// src/components/trade/chart/chart-toolbar.tsx
"use client";

import React from "react";
import { LineChart, Wand2, Eraser, ChevronDown, Square } from "lucide-react";
import MarketDataService from "@/services/market-data-service";

export default function ChartToolbar({ engineApi }: { engineApi?: any }) {
  const ui = engineApi ?? (typeof window !== "undefined" && (window as any).__FK_CHART__?.engine?.ui);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={() => ui?.zoomIn?.()} title="Zoom in"><LineChart size={16} /></button>
      <button onClick={() => ui?.zoomOut?.()} title="Zoom out">－</button>
      <button onClick={() => ui?.resetZoom?.()} title="Reset">Reset</button>
      <button onClick={() => ui?.addSMA?.(20)} title="Add SMA20">SMA20</button>
      <button onClick={() => ui?.addEMA?.(20)} title="Add EMA20">EMA20</button>
      <button onClick={() => ui?.addRSI?.(14)} title="Add RSI">RSI</button>
      <button onClick={() => ui?.enableTrendTool?.()} title="Trend"><Wand2 size={16} /></button>
    </div>
  );
}
