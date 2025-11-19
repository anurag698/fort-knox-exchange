
// src/components/trade/orderbook/orderbook-panel.tsx
"use client";

import React, { useMemo } from "react";
import { useMarketDataStore } from "@/state/market-data-store";

function bucketed(orders: { price: number; size: number }[] | undefined, size = 1) {
  if (!orders || orders.length === 0) return [];
  const map = new Map<number, number>();
  orders.forEach((lvl) => {
    if (!lvl.price || !lvl.size) return;
    const bucket = Math.round(lvl.price / size) * size;
    map.set(bucket, (map.get(bucket) || 0) + lvl.size);
  });
  const arr = Array.from(map.entries()).map(([price, size]) => ({ price, size }));
  return arr.sort((a, b) => b.price - a.price);
}

export default function OrderbookPanel({ depthBucket = 0.5 }: { depthBucket?: number }) {
  const depth = useMarketDataStore((s) => s.depth);

  const bids = useMemo(() => bucketed(depth?.bids, depthBucket), [depth, depthBucket]);
  const asks = useMemo(() => bucketed(depth?.asks, depthBucket), [depth, depthBucket]);

  return (
    <div className="orderbook-panel">
      <div className="header">Order Book</div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="subhead">Bids</div>
          <div className="list">
            {bids.map((b) => (
              <div key={b.price} style={{ display: "flex", justifyContent: "space-between" }}>
                <div>{b.price.toFixed(6)}</div>
                <div>{b.size.toFixed(4)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="subhead">Asks</div>
          <div className="list">
            {asks.map((a) => (
              <div key={a.price} style={{ display: "flex", justifyContent: "space-between" }}>
                <div>{a.price.toFixed(6)}</div>
                <div>{a.size.toFixed(4)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
