
// src/components/home/popular-coins.tsx
"use client";

import React, { useEffect } from "react";
import marketDataService from "@/services/market-data-service";
import { useMarketDataStore } from "@/state/market-data-store";

export default function PopularCoins() {
  const markets = [
    // keep a minimal list here or import from your markets config
    { id: "BTC-USDT", label: "BTC/USDT" },
    { id: "NOMOX-USDT", label: "NOMOX/USDT" },
    { id: "POL-USDT", label: "POL/USDT" },
  ];

  const ticker = useMarketDataStore((s) => s.ticker);
  const setSymbol = useMarketDataStore((s) => s.setSymbol);

  useEffect(() => {
    // Subscribe to the first market's feed for preview purposes
    if (markets.length === 0) return;
    const first = markets[0].id.replace("-", "").toUpperCase();

    // Use the new API
    marketDataService.startFeed(first, "1m");
    setSymbol(first);

    return () => {
      marketDataService.stopFeed();
    };
  }, [setSymbol]);

  return (
    <div className="popular-coins">
      <h3>Popular</h3>
      <ul>
        {markets.map((m) => (
          <li key={m.id}>
            <button
              onClick={() => {
                const sym = m.id.replace("-", "").toUpperCase();
                // start feed for selected market
                marketDataService.startFeed(sym, "1m");
                setSymbol(sym);
              }}
            >
              {m.label}
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 12 }}>
        <strong>Live ticker preview:</strong>
        <div>
          Price: {ticker?.lastPrice ?? "—"} | Bid: {ticker?.bidPrice ?? "—"} | Ask:{" "}
          {ticker?.askPrice ?? "—"}
        </div>
      </div>
    </div>
  );
}
