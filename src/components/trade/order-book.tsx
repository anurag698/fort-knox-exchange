
"use client";

import { useMarketDataStore } from "@/state/market-data-store";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function OrderBook() {
  const bids = useMarketDataStore((s) => s.bids);
  const asks = useMarketDataStore((s) => s.asks);

  const [bin, setBin] = useState("1"); // default grouping size: 1 unit

  /* ----------------------------------------------------
     SAFE GROUPING FUNCTION
     (Prevents crashes in Firebase Studio when data empty)
  -----------------------------------------------------*/
  const grouped = useMemo(() => {
    const size = Number(bin);
    if (!size || Number.isNaN(size)) return { bids: [], asks: [] };

    const groupSide = (orders: any[]) => {
      if (!Array.isArray(orders)) return [];

      const map = new Map<number, number>();

      for (const lvl of orders) {
        if (!lvl || !lvl.price || !lvl.size) continue;

        const bucket = Math.round(Number(lvl.price) / size) * size;
        const prev = map.get(bucket) || 0;
        map.set(bucket, prev + Number(lvl.size));
      }

      return [...map.entries()]
        .map(([price, size]) => ({ price, size }))
        .sort((a, b) => a.price - b.price);
    };

    return {
      bids: groupSide(bids),
      asks: groupSide(asks),
    };
  }, [bids, asks, bin]);

  const maxBid = grouped.bids.length
    ? Math.max(...grouped.bids.map((b) => b.size))
    : 1;

  const maxAsk = grouped.asks.length
    ? Math.max(...grouped.asks.map((a) => a.size))
    : 1;

  /* ----------------------------------------------------
     RENDER ONE ORDER ROW
  -----------------------------------------------------*/
  const Row = ({
    price,
    size,
    max,
    type,
  }: {
    price: number;
    size: number;
    max: number;
    type: "bid" | "ask";
  }) => {
    const pct = size / max;
    return (
      <div className="relative h-[20px] px-2 text-xs flex justify-between items-center overflow-hidden">
        {/* Background bar */}
        <div
          className={cn(`absolute inset-y-0 right-0`, type === "bid" ? "bg-chartgreen/10" : "bg-chartred/10")}
          style={{ width: `${pct * 100}%` }}
        />

        {/* Content */}
        <div className="relative z-10 flex-1 flex justify-between">
          <span
            className={type === "bid" ? "text-chartgreen" : "text-chartred"}
          >
            {price.toFixed(2)}
          </span>
          <span className="text-foreground/70">{size.toFixed(4)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-card border rounded-lg overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <span className="text-sm font-medium">Orderbook</span>

        {/* Bin selector */}
        <select
          value={bin}
          onChange={(e) => setBin(e.target.value)}
          className="text-xs bg-background p-1 rounded border"
        >
          <option value="0.1">0.1</option>
          <option value="0.5">0.5</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="5">5</option>
          <option value="10">10</option>
        </select>
      </div>

      {/* ASKS */}
      <div className="flex-1 overflow-auto flex flex-col-reverse">
        {grouped.asks.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground flex-1 flex items-center justify-center">
            No asks available
          </div>
        ) : (
          grouped.asks
            .slice(-20) // show last 20 asks
            .map((lvl, i) => (
              <Row
                key={`ask-${i}`}
                price={lvl.price}
                size={lvl.size}
                max={maxAsk}
                type="ask"
              />
            ))
        )}
      </div>

      {/* MID PRICE BAR */}
      <div className="px-3 py-2 text-center border-y bg-muted/50 text-sm font-semibold text-accent">
        Mid Market Price
      </div>

      {/* BIDS */}
      <div className="flex-1 overflow-auto">
        {grouped.bids.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground flex-1 flex items-center justify-center">
            No bids available
          </div>
        ) : (
          grouped.bids
            .slice()
            .reverse()
            .slice(0, 20) // show top 20 bids
            .map((lvl, i) => (
            <Row
              key={`bid-${i}`}
              price={lvl.price}
              size={lvl.size}
              max={maxBid}
              type="bid"
            />
          ))
        )}
      </div>
    </div>
  );
}
