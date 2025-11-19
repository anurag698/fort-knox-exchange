// src/components/debug/FeedStatusWidget.tsx
"use client";

import React, { useEffect, useState } from "react";
import MarketDataService from "@/services/market-data-service";
import useMarketDataStore from "@/state/market-data-store";

export default function FeedStatusWidget({ defaultSymbol = "BTCUSDT" }: { defaultSymbol?: string }) {
  const [symbol, setSymbol] = useState(defaultSymbol.replace("-", "").toUpperCase());
  const [interval, setInterval] = useState("1m");
  const feedStatus = useMarketDataStore((s) => s.feedStatus);

  useEffect(() => {
    const onStatus = (payload: any) => {
      // store will also receive it — this is just local logging
    };
    // optional: attach temporary bus listener for debug
    return () => {};
  }, []);

  return (
    <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999, background: "rgba(6,10,20,0.95)", color: "#fff", padding: 12, borderRadius: 8, width: 260, boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Feed Status</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.replace("-", "").toUpperCase())} style={{ flex: 1, padding: 6, borderRadius: 6, background: '#333', border: '1px solid #555', color: '#fff' }} />
        <select value={interval} onChange={(e) => setInterval(e.target.value)} style={{ padding: 6, borderRadius: 6, background: '#333', border: '1px solid #555', color: '#fff' }}>
          <option value="1m">1m</option>
          <option value="5m">5m</option>
          <option value="15m">15m</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={() => MarketDataService.startFeed(symbol, interval)}
          style={{ flex: 1, padding: 8, borderRadius: 6, background: '#22c55e', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          Start
        </button>
        <button
          onClick={() => MarketDataService.stopFeed()}
          style={{ flex: 1, padding: 8, borderRadius: 6, background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          Stop
        </button>
      </div>

      <div style={{ marginTop: 8, fontSize: 12 }}>
        <div>Status: <strong>{feedStatus?.status ?? "unknown"}</strong></div>
        <div>Symbol: {feedStatus?.symbol ?? "—"}</div>
        <div>Interval: {feedStatus?.interval ?? "—"}</div>
      </div>
    </div>
  );
}
