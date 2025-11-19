// src/components/trade/orderbook/orderbook-panel.tsx
"use client";

import React, { useMemo } from "react";
import useMarketDataStore from "@/state/market-data-store";

type Level = { price: number; size: number };

function bucketOrders(orders: Level[] = [], bucketSize = 1) {
  if (!Array.isArray(orders)) return [];
  const map = new Map<number, number>();
  for (const o of orders) {
    if (!o || !isFinite(o.price) || !isFinite(o.size)) continue;
    const key = Math.round(o.price / bucketSize) * bucketSize;
    map.set(key, (map.get(key) || 0) + o.size);
  }
  return Array.from(map.entries()).map(([price, size]) => ({ price, size })).sort((a, b) => b.price - a.price);
}

export default function OrderbookPanel({ bucketSize = 0.5 }: { bucketSize?: number }) {
  const depth = useMarketDataStore((s) => s.getOrderbook(s.symbol || "BTCUSDT") ?? null);
  // Note: getOrderbook selector was provided in the store; if you pass symbol explicitly, change accordingly

  const bids = useMemo(() => bucketOrders(depth?.bids ?? [], bucketSize), [depth, bucketSize]);
  const asks = useMemo(() => bucketOrders(depth?.asks ?? [], bucketSize), [depth, bucketSize]);

  return (
    <div className="orderbook-panel" style={{ padding: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Order Book</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={{ opacity: 0.7 }}>Bids</div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {bids.map((b) => (
              <div key={b.price} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ color: "#0ecb81" }}>{b.price.toFixed(6)}</span>
                <span style={{ opacity: 0.85 }}>{b.size.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ opacity: 0.7 }}>Asks</div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {asks.map((a) => (
              <div key={a.price} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ color: "#ff6b6b" }}>{a.price.toFixed(6)}</span>
                <span style={{ opacity: 0.85 }}>{a.size.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
