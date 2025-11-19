// src/components/trade/position-panel.tsx
"use client";

import React from "react";
import { useMarketDataStore } from "@/state/market-data-store";

export default function PositionPanel() {
  // For now, we display simple mock position info from store (extend as needed)
  const ticker = useMarketDataStore((s) => s.ticker);

  return (
    <div className="position-panel">
      <h4>Position</h4>
      <div>Last: {ticker?.lastPrice ?? "—"}</div>
      <div>Unrealized PnL: {/* compute if you store positions */}—</div>
    </div>
  );
}
