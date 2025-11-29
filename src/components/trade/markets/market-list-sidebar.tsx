
"use client";

import { useEffect, useMemo, useState } from "react";
import MarketListItem from "./market-list-item";
import { useMarketDataStore } from "@/state/market-data-store";
import { useMarkets } from "@/hooks/use-markets";
import { Search, Star } from "lucide-react";

const TABS = ["Favorites", "Spot", "Trending"];

export default function MarketListSidebar() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Spot");

  const { data: markets } = useMarkets();
  const tickers = useMarketDataStore((s) => s.ticker);

  // Filter logic
  const filtered = useMemo(() => {
    if (!markets) return [];
    let list = [...markets];

    if (activeTab === "Favorites") {
      list = list.filter((m) => (m as any).isFavorite);
    }

    if (search.length > 0) {
      list = list.filter((m) =>
        m.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    return list;
  }, [markets, activeTab, search]);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] border-r border-[var(--border-color)]">

      {/* ---------- Search Bar ---------- */}
      <div className="p-3 border-b border-[var(--border-color)]">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-2 top-2.5 text-[var(--text-secondary)]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search markets"
            className="w-full pl-8 pr-2 py-2 rounded-md bg-[var(--bg-primary)]
                       text-[var(--text-primary)] placeholder-[var(--text-secondary)]
                       border border-[var(--border-color)] focus:outline-none"
          />
        </div>
      </div>

      {/* ---------- Tabs ---------- */}
      <div className="flex border-b border-[var(--border-color)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm
              ${activeTab === tab
                ? "text-[var(--brand-gold)] border-b-2 border-[var(--brand-gold)] font-semibold"
                : "text-[var(--text-secondary)]"
              }`
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ---------- Markets List ---------- */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-[#1f2937]">
        {filtered.map((market) => (
          <MarketListItem
            key={market.id}
            market={market}
          />
        ))}
      </div>
    </div>
  );
}
