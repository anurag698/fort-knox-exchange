// src/components/home/popular-coins.tsx
"use client";

import React from "react";
import { useMarketDataStore } from "@/state/market-data-store";
import marketDataService from "@/services/market-data-service";

function PopularCoins({ list }: { list?: { id: string; label?: string }[] }) {
  const markets = list ?? [
    { id: "BTC-USDT", label: "BTC/USDT" },
    { id: "ETH-USDT", label: "ETH/USDT" },
    { id: "NOMOX-USDT", label: "NOMOX/USDT" },
  ];

  const ticker = useMarketDataStore((s) => s.ticker);

  return (
    <div className="popular-coins">
      <h4>Popular</h4>
      <ul>
        {markets.map(m => {
          const sym = m.id.replace("-", "").toUpperCase();
          return (
            <li key={m.id}>
              <button onClick={() => marketDataService.startFeed(sym, "1m")}>{m.label ?? m.id}</button>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: 8 }}>
        <div>Last price: {ticker?.lastPrice ?? "—"}</div>
      </div>
    </div>
  );
}

export default PopularCoins;
