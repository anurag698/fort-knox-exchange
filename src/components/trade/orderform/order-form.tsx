// src/components/trade/orderform/order-form.tsx
"use client";

import React, { useState } from "react";
import useMarketDataStore from "@/state/market-data-store";
import MarketDataService from "@/services/market-data-service";

export default function OrderForm({ marketId }: { marketId?: string }) {
  const storeSymbol = useMarketDataStore((s) => s.symbol ?? "");
  const chosen = (marketId ?? storeSymbol ?? "BTC-USDT").replace("-", "").toUpperCase();
  const displayBase = chosen.replace("USDT", "");

  const [amount, setAmount] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");

  const placeMarket = () => {
    // TODO: wire to your backend order placement
    console.log("Place market order", { symbol: chosen, amount });
  };

  const placeLimit = () => {
    console.log("Place limit order", { symbol: chosen, amount, price });
  };

  return (
    <div className="order-form" style={{ padding: 8, background: "#071026", borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Trade — {chosen}</div>

      <label style={{ fontSize: 12, color: "#a8b3c7" }}>Amount ({displayBase})</label>
      <input
        value={amount === "" ? "" : amount}
        onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
        type="number"
        style={{ width: "100%", padding: 8, margin: "6px 0", borderRadius: 6 }}
      />

      <label style={{ fontSize: 12, color: "#a8b3c7" }}>Price (USDT)</label>
      <input
        value={price === "" ? "" : price}
        onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
        type="number"
        style={{ width: "100%", padding: 8, margin: "6px 0", borderRadius: 6 }}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={placeMarket} style={{ flex: 1, padding: 10, borderRadius: 6 }}>
          Buy Market
        </button>
        <button onClick={placeLimit} style={{ flex: 1, padding: 10, borderRadius: 6 }}>
          Buy Limit
        </button>
      </div>
    </div>
  );
}
