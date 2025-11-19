
// src/components/trade/orderform/order-form.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMarketDataStore } from "@/state/market-data-store";

export default function OrderForm({ marketId }: { marketId?: string }) {
  const storeSymbol = useMarketDataStore((s) => s.symbol);
  const current = marketId ? marketId.replace("-", "").toUpperCase() : storeSymbol;
  const [amount, setAmount] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const router = useRouter();

  const placeMarket = () => {
    // stub: send order to your backend matching engine
    console.log("Place market order", { symbol: current, amount });
    // For demo, navigate to orders
    router.push("/orders");
  };

  return (
    <div className="order-form">
      <div className="header">Place Order</div>

      <div style={{ marginTop: 8 }}>
        <label className="text-xs">Instrument</label>
        <div>{current}</div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label className="text-xs">Amount ({current.replace("USDT", "")})</label>
        <input
          type="number"
          value={amount === "" ? "" : amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <label className="text-xs">Price (optional)</label>
        <input
          type="number"
          value={price === "" ? "" : price}
          onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={placeMarket} className="btn btn-primary">Buy</button>
        <button onClick={() => {}} className="btn btn-ghost">Sell</button>
      </div>
    </div>
  );
}
