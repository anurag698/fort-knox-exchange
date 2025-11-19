// src/components/trade/orderbook/orderbook-panel.tsx
"use client";

import React, { useMemo } from "react";
import { useMarketDataStore } from "@/state/market-data-store";

function bucketOrders(orders: { price: number; size: number }[] = [], bucketSize = 0.5) {
  const map = new Map<number, number>();
  for (const o of orders) {
    if (!o || !o.price) continue;
    const key = Math.round(o.price / bucketSize) * bucketSize;
    map.set(key, (map.get(key) || 0) + o.size);
  }
  return Array.from(map.entries()).map(([price, size]) => ({ price, size })).sort((a,b)=>b.price-a.price);
}

export default function OrderbookPanel({ bucketSize = 0.5 }: { bucketSize?: number }) {
  const depth = useMarketDataStore((s) => s.depth);

  const bids = useMemo(() => bucketOrders(depth?.bids || [], bucketSize), [depth, bucketSize]);
  const asks = useMemo(() => bucketOrders(depth?.asks || [], bucketSize), [depth, bucketSize]);

  return (
    <div className="orderbook-panel">
      <div className="header">Order Book</div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div>Bids</div>
          {bids.map(b => (
            <div key={b.price} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{b.price.toFixed(6)}</span>
              <span>{b.size.toFixed(4)}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div>Asks</div>
          {asks.map(a => (
            <div key={a.price} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{a.price.toFixed(6)}</span>
              <span>{a.size.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
