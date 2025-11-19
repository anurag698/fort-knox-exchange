// src/components/trade/markets/markets-sidebar.tsx
"use client";

import React from "react";
import marketDataService from "@/services/market-data-service";
import { useMarketDataStore } from "@/state/market-data-store";
import { useRouter } from "next/navigation";

export default function MarketsSidebar({ markets }: { markets?: { id: string; label?: string }[] }) {
  const router = useRouter();
  const current = useMarketDataStore((s) => s.symbol);
  const list = markets ?? [
    { id: "BTC-USDT", label: "BTC/USDT" },
    { id: "ETH-USDT", label: "ETH/USDT" },
    { id: "NOMOX-USDT", label: "NOMOX/USDT" },
    { id: "POL-USDT", label: "POL/USDT" },
  ];

  return (
    <aside className="markets-sidebar">
      <h4>Markets</h4>
      <ul>
        {list.map(m => {
          const sym = m.id.replace("-", "").toUpperCase();
          const active = current === sym;
          return (
            <li key={m.id} className={active ? "active" : ""}>
              <button onClick={() => { marketDataService.startFeed(sym, "1m"); router.push(`/trade/${m.id}`); }}>
                {m.label ?? m.id}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
