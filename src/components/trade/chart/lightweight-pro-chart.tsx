// src/components/trade/chart/lightweight-pro-chart.tsx
"use client";

import React from "react";
import ChartEngineComponent from "./chart-engine";

// Lightweight wrapper that simply mounts the engine (legacy usage preserved)
export default function LightweightProChart({ pair, interval, height = 600 } : { pair?: string; interval?: string; height?: number }) {
  const symbol = (pair ?? "BTC-USDT").replace("-", "").toUpperCase();

  return (
    <div style={{ width: "100%", height }}>
      <ChartEngineComponent symbol={symbol} interval={interval ?? "1m"} height={height} />
    </div>
  );
}
