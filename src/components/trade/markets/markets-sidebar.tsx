
// src/components/trade/markets/markets-sidebar.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMarketDataStore } from "@/state/market-data-store";
import marketDataService from "@/services/market-data-service";

type Market = { id: string; label?: string };

export default function MarketsSidebar({ markets }: { markets?: Market[] }) {
  const router = useRouter();
  const symbol = useMarketDataStore((s) => s.symbol);

  // fallback markets if none provided
  const list = markets ?? [
    { id: "BTC-USDT", label: "BTC/USDT" },
    { id: "ETH-USDT", label: "ETH/USDT" },
    { id: "NOMOX-USDT", label: "NOMOX/USDT" },
  ];

  return (
    <aside className="markets-sidebar">
      <div className="header">Markets</div>
      <ul>
        {list.map((m) => {
          const sym = m.id.replace("-", "").toUpperCase();
          const active = symbol === sym;
          return (
            <li key={m.id} className={active ? "active" : ""}>
              <button
                onClick={() => {
                  // start feed for selected market and navigate to trade page
                  marketDataService.startFeed(sym, "1m");
                  router.push(`/trade/${m.id}`);
                }}
              >
                {m.label ?? m.id}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
