// src/components/trade/markets/market-list-item.tsx
"use client";

import React from "react";
import { useMarketDataStore } from "@/state/market-data-store";
import marketDataService from "@/services/market-data-service";

export default function MarketListItem({ market }: { market: { id: string; name?: string } }) {
  const symbol = useMarketDataStore((s) => s.symbol);
  const sym = market.id.replace("-", "").toUpperCase();
  const active = symbol === sym;

  return (
    <div className={`market-list-item ${active ? "active" : ""}`}>
      <button onClick={() => marketDataService.startFeed(sym, "1m")}>{market.name ?? market.id}</button>
    </div>
  );
}
