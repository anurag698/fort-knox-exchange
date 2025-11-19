// src/components/trade/orderform/order-form.tsx
"use client";

import React, { useState } from "react";
import { useMarketDataStore } from "@/state/market-data-store";
import marketDataService from "@/services/market-data-service";

export default function OrderForm({ marketId }: { marketId?: string }) {
  const storeSymbol = useMarketDataStore((s) => s.symbol);
  const symbol = (marketId ?? storeSymbol ?? "BTCUSDT").replace("-", "").toUpperCase();
  const [size, setSize] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");

  const placeMarketBuy = () => {
    // wire to your backend / matching engine; here we just log
    console.log("Place market buy", { symbol, size });
  };

  const placeLimitBuy = () => {
    console.log("Place limit buy", { symbol, size, price });
  };

  return (
    <div className="order-form">
      <h4>Order Form — {symbol}</h4>
      <label>Amount</label>
      <input type="number" value={size === "" ? "" : size} onChange={(e)=>setSize(e.target.value === "" ? "" : Number(e.target.value))} />
      <label>Price (optional)</label>
      <input type="number" value={price === "" ? "" : price} onChange={(e)=>setPrice(e.target.value === "" ? "" : Number(e.target.value))} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={placeMarketBuy}>Buy Market</button>
        <button onClick={placeLimitBuy}>Buy Limit</button>
      </div>
    </div>
  );
}
