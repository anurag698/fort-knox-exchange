
"use client";

import { useMarketDataStore } from "@/state/market-data-store";
import { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useMarkets } from "@/hooks/use-markets";

interface OrderBookProps {
  marketId: string;
}

export default function OrderBook({ marketId }: OrderBookProps) {
  // Convert marketId (e.g., "BTC-USDT") to symbol format (e.g., "BTCUSDT")
  const symbol = marketId.replace('-', '').toUpperCase();

  // Use the getOrderbook selector for this specific symbol
  const depth = useMarketDataStore((s) => s.getOrderbook(symbol));

  const { data: markets } = useMarkets();
  const market = useMemo(() => markets?.find(m => m.id === marketId), [markets, marketId]);

  const [bin, setBin] = useState("0.1"); // default grouping size
  const [flashingRows, setFlashingRows] = useState<Set<string>>(new Set());
  const prevDepthRef = useRef<typeof depth>(depth);

  const pricePrecision = market?.pricePrecision ?? 2;
  const qtyPrecision = market?.quantityPrecision ?? 4;

  // Flash animation when prices update
  useEffect(() => {
    if (!depth || !prevDepthRef.current) return;

    const newFlashes = new Set<string>();

    // Check for changed bids
    depth.bids?.forEach((bid, idx) => {
      const prevBid = prevDepthRef.current?.bids?.[idx];
      if (prevBid && (prevBid.price !== bid.price || prevBid.size !== bid.size)) {
        newFlashes.add(`bid-${bid.price}`);
      }
    });

    // Check for changed asks
    depth.asks?.forEach((ask, idx) => {
      const prevAsk = prevDepthRef.current?.asks?.[idx];
      if (prevAsk && (prevAsk.price !== ask.price || prevAsk.size !== ask.size)) {
        newFlashes.add(`ask-${ask.price}`);
      }
    });

    if (newFlashes.size > 0) {
      setFlashingRows(newFlashes);
      setTimeout(() => setFlashingRows(new Set()), 400);
    }

    prevDepthRef.current = depth;
  }, [depth]);


  /* ----------------------------------------------------
     SAFE GROUPING FUNCTION
  -----------------------------------------------------*/
  const grouped = useMemo(() => {
    const size = Number(bin);
    if (!size || Number.isNaN(size) || !depth) return { bids: [], asks: [] };

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
      bids: groupSide(depth.bids),
      asks: groupSide(depth.asks),
    };
  }, [depth, bin]);

  const maxBid = grouped.bids.length ? Math.max(...grouped.bids.map((b) => b.size)) : 1;
  const maxAsk = grouped.asks.length ? Math.max(...grouped.asks.map((a) => a.size)) : 1;

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
    const isFlashing = flashingRows.has(`${type}-${price}`);

    return (
      <div className={cn(
        "relative h-[22px] px-2 text-xs flex justify-between items-center overflow-hidden cursor-pointer hover:bg-muted/20 transition-all group",
        isFlashing && (type === "bid" ? "flash-green" : "flash-red")
      )}>
        {/* Background bar with gradient */}
        <div
          className={cn(
            `absolute inset-y-0 right-0 transition-all duration-300`,
            type === "bid"
              ? "bg-gradient-to-l from-green-500/15 to-green-500/5"
              : "bg-gradient-to-l from-red-500/15 to-red-500/5"
          )}
          style={{ width: `${pct * 100}%` }}
        />

        {/* Content */}
        <div className="relative z-10 flex-1 flex justify-between font-mono">
          <span
            className={cn(
              "font-medium transition-colors",
              type === "bid" ? "text-green-500 group-hover:text-green-400" : "text-red-500 group-hover:text-red-400"
            )}
          >
            {price.toFixed(pricePrecision)}
          </span>
          <span className="text-foreground/70 group-hover:text-foreground">{size.toFixed(qtyPrecision)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col glass rounded-lg overflow-hidden animate-slide-in-down">
      {/* HEADER with Glassmorphism */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border-b border-primary/20">
        <span className="text-sm font-semibold flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          Order Book
        </span>

        {/* Bin selector with premium styling */}
        <select
          value={bin}
          onChange={(e) => setBin(e.target.value)}
          className="text-xs bg-background/80 px-2 py-1 rounded-md border border-primary/20 text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
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
      <div className="flex-1 overflow-auto flex flex-col-reverse scrollbar-thin">
        {(!depth || grouped.asks.length === 0) ? (
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

      {/* MID PRICE BAR with Premium Style */}
      <div className="px-3 py-2 text-center border-y border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 text-sm font-bold text-primary backdrop-blur-sm">
        {depth?.mid?.toFixed(pricePrecision) ?? '...'}
      </div>

      {/* BIDS */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {(!depth || grouped.bids.length === 0) ? (
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
