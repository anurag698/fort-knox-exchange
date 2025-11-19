// src/components/home/popular-coins.tsx
"use client";

import React from "react";
import MarketDataService from "@/services/market-data-service";
import useMarketDataStore from "@/state/market-data-store";

export default function PopularCoins({ list }: { list?: { id: string; label?: string }[] }) {
  const markets = list ?? [
    { id: "BTC-USDT", label: "BTC/USDT" },
    { id: "ETH-USDT", label: "ETH/USDT" },
    { id: "NOMOX-USDT", label: "NOMOX/USDT" },
  ];

  // show the ticker for the first market in store if exists
  const storeTicker = useMarketDataStore((s) => s.ticker[(s.symbol ?? "BTCUSDT")] ?? null);

  return (
    <div style={{ padding: 8 }}>
      <h4>Popular</h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {markets.map((m) => {
          const sym = m.id.replace("-", "").toUpperCase();
          return (
            <li key={m.id} style={{ marginBottom: 6 }}>
              <button
                onClick={() => {
                  MarketDataService.startFeed(sym, "1m");
                }}
                style={{ padding: "6px 8px", borderRadius: 6 }}
              >
                {m.label ?? m.id}
              </button>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: 8 }}>
        <div style={{ opacity: 0.7 }}>Live</div>
        <div>Last price: {storeTicker?.lastPrice ?? "—"}</div>
      </div>
    </div>
  );
}
