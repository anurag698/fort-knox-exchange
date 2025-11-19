// src/components/trade/market-switcher.tsx
"use client";

import React from "react";
import marketDataService from "@/services/market-data-service";

export default function MarketSwitcher({ markets }: { markets: string[] }) {
  return (
    <div className="market-switcher">
      {markets.map(m => {
        const id = m.replace("-", "").toUpperCase();
        return <button key={m} onClick={() => marketDataService.startFeed(id, "1m")}>{m}</button>;
      })}
    </div>
  );
}
