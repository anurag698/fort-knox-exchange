"use client";

import { useEffect, useState } from "react";
import { useMarketDataStore } from "@/stores/market-data-store";
import { cn } from "@/lib/utils";

const GROUPS = ["0.01", "0.1", "1.0"];

export default function OrderbookPanel({ pair }: { pair: string }) {
  const { bids, asks } = useMarketDataStore();
  const [group, setGroup] = useState("0.01");

  const grouped = (orders: any[] | undefined, g: string) => {
    if (!orders || !Array.isArray(orders)) return [];

    const size = parseFloat(g);
    const map = new Map();

    orders.forEach((lvl) => {
      if (!lvl.price || !lvl.size) return;
      const bucket = Math.round(lvl.price / size) * size;
      const prev = map.get(bucket) || 0;
      map.set(bucket, prev + lvl.size);
    });

    return [...map.entries()]
      .map(([p, s]) => ({ price: p, size: s }))
      .sort((a, b) => a.price - b.price);
  };

  const groupedBids = grouped(bids, group).sort((a, b) => b.price - a.price);
  const groupedAsks = grouped(asks, group).sort((a, b) => a.price - b.price);

  const maxBid = groupedBids.length ? Math.max(...groupedBids.map((x) => x.size)) : 1;
  const maxAsk = groupedAsks.length ? Math.max(...groupedAsks.map((x) => x.size)) : 1;

  const bestBid = groupedBids[0]?.price ?? 0;
  const bestAsk = groupedAsks[0]?.price ?? 0;
  const spread = bestAsk && bestBid ? (bestAsk - bestBid).toFixed(6) : "--";

  return (
    <div className="flex flex-col h-full p-3 text-[var(--text-primary)]">

      {/* ---------------- HEADER ---------------- */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
        <span className="font-semibold text-sm">Order Book</span>

        <div className="flex items-center gap-1">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "px-2 py-1 text-xs rounded-md border transition",
                group === g
                  ? "text-[var(--brand-blue)] border-[var(--brand-blue)]"
                  : "text-[var(--text-secondary)] border-[var(--border-color)]"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- ASKS ---------------- */}
      <div className="flex-1 overflow-auto pt-2">
        {groupedAsks
          .slice(0, 15)
          .reverse()
          .map((lvl, i) => (
            <div key={i} className="relative flex justify-between items-center py-0.5 text-xs">
              {/* Heat background */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#F54E5D]/20"
                style={{ width: `${(lvl.size / maxAsk) * 100}%` }}
              />

              <span className="relative text-[var(--text-primary)]">{lvl.price.toFixed(6)}</span>
              <span className="relative text-[var(--text-secondary)]">{lvl.size.toFixed(4)}</span>
            </div>
          ))}
      </div>

      {/* ---------------- SPREAD ---------------- */}
      <div className="py-2 flex items-center justify-center text-[var(--text-secondary)] text-xs">
        Spread: <span className="ml-1 text-[var(--brand-gold)] font-semibold">{spread}</span>
      </div>

      {/* ---------------- BIDS ---------------- */}
      <div className="flex-1 overflow-auto pb-2">
        {groupedBids.slice(0, 15).map((lvl, i) => (
          <div key={i} className="relative flex justify-between items-center py-0.5 text-xs">
            <div
              className="absolute right-0 top-0 bottom-0 bg-[#1AC186]/20"
              style={{ width: `${(lvl.size / maxBid) * 100}%` }}
            />

            <span className="relative text-[var(--text-primary)]">{lvl.price.toFixed(6)}</span>
            <span className="relative text-[var(--text-secondary)]">{lvl.size.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
