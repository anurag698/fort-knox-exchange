"use client";

import { useState, useMemo, useEffect } from "react";
import { MarketListItem } from "./market-list-item";
import { useMarkets } from "@/hooks/use-markets";
import { cn } from "@/lib/utils";
import { useMarketDataStore } from "@/state/market-data-store";
import type { MarketData } from "@/lib/types";

export function MarketListSidebar() {
  const { data: markets, isLoading } = useMarkets();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"volume" | "change">("volume");
  const [liveData, setLiveData] = useState<Record<string, MarketData>>({});

  // This is a simplified subscription for all market tickers for the sidebar
  useEffect(() => {
    if (!markets) return;
    const symbols = markets.map(m => m.id.replace('-', '').toLowerCase() + '@ticker');
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols.join('/')}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.s) {
        const marketId = message.s.replace(/USDT$/, '-USDT'); // basic conversion
        setLiveData(prev => ({
          ...prev,
          [marketId]: {
            price: parseFloat(message.c),
            priceChangePercent: parseFloat(message.P),
            volume: parseFloat(message.v),
            high: parseFloat(message.h),
            low: parseFloat(message.l),
            id: marketId,
            lastUpdated: new Date(),
            marketCap: 0,
          }
        }))
      }
    };

    ws.onerror = (error) => {
      console.error("Sidebar WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [markets]);

  const enrichedMarkets = useMemo(() => {
    if (!markets) return [];
    return markets.map(market => ({
      ...market,
      marketData: liveData[market.id] || null
    })).filter(m => m.marketData); // Only show markets with live data
  }, [markets, liveData]);


  const filtered = useMemo(() => {
    if (!enrichedMarkets) return [];

    let list = enrichedMarkets.filter((m) =>
      m.id.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === "volume") {
      list = list.sort((a, b) => (b.marketData?.volume || 0) - (a.marketData?.volume || 0));
    } else {
      list = list.sort((a, b) => (b.marketData?.priceChangePercent || 0) - (a.marketData?.priceChangePercent || 0));
    }

    return list;
  }, [enrichedMarkets, search, sortBy]);

  return (
    <aside className={cn(
      "w-[280px] h-screen bg-[#0d0f12] border-r border-neutral-800",
      "flex flex-col"
    )}>

      {/* Search bar */}
      <div className="p-3 border-b border-neutral-800">
        <input
          placeholder="Search markets"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded bg-[#1a1d21] px-3 py-2 text-sm outline-none text-neutral-200"
        />
      </div>

      {/* Sort buttons */}
      <div className="flex items-center border-b border-neutral-800 text-xs text-neutral-400">
        <button
          onClick={() => setSortBy("volume")}
          className={cn(
            "flex-1 px-3 py-2",
            sortBy === "volume" && "text-white border-b-2 border-yellow-400"
          )}
        >
          Volume
        </button>
        <button
          onClick={() => setSortBy("change")}
          className={cn(
            "flex-1 px-3 py-2",
            sortBy === "change" && "text-white border-b-2 border-green-400"
          )}
        >
          Change %
        </button>
      </div>

      {/* Market list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && !filtered.length && (
          <div className="p-4 text-neutral-500">Loading markets...</div>
        )}

        {filtered.map((m) => (
          <MarketListItem key={m.id} market={m} />
        ))}
      </div>
    </aside>
  );
}
