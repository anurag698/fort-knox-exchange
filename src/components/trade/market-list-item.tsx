
// src/components/trade/market-list-item.tsx
"use client";

import React from "react";
import marketDataService from "@/services/market-data-service";
import { useMarketDataStore } from "@/state/market-data-store";

export default function MarketListItem({ market }: { market: { id: string; name?: string } }) {
  const symbol = useMarketDataStore((s) => s.symbol);
  const active = symbol === market.id.replace("-", "").toUpperCase();

  return (
    <div className={`market-list-item ${active ? "active" : ""}`}>
      <button
        onClick={() => {
          const sym = market.id.replace("-", "").toUpperCase();
          marketDataService.startFeed(sym, "1m");
        }}
      >
        {market.name ?? market.id}
      </button>
    </div>
  );
}
