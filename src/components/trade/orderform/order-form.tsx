"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  marketId: string;
  price?: number; // live price from ticker (optional)
};

export default function OrderForm({ marketId, price }: Props) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"market" | "limit">("market");

  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  /* ------------------------------------------------------------
     TOTAL CALCULATION
  ------------------------------------------------------------ */
  const total = useMemo(() => {
    const a = Number(amount) || 0;
    const p = type === "market" ? price ?? 0 : Number(limitPrice) || 0;
    return (a * p).toFixed(6);
  }, [amount, limitPrice, price, type]);

  /* ------------------------------------------------------------
     AMOUNT % SLIDER
  ------------------------------------------------------------ */
  const setPercent = (p: number) => {
    // Placeholder wallet balance (replace with real data later)
    const fakeBalance = 1000;
    const livePrice = price ?? 0;

    if (type === "market") {
      const qty = fakeBalance * (p / 100) / livePrice;
      setAmount(qty.toFixed(6));
    } else {
      const lp = Number(limitPrice) || livePrice;
      const qty = fakeBalance * (p / 100) / lp;
      setAmount(qty.toFixed(6));
    }
  };

  /* ------------------------------------------------------------
     SUBMIT (placeholder)
  ------------------------------------------------------------ */
  const submit = () => {
    alert(
      JSON.stringify(
        {
          action: "order_submitted",
          side,
          type,
          amount,
          price: type === "market" ? "MARKET" : limitPrice,
          total,
          marketId,
        },
        null,
        2
      )
    );
  };

  return (
    <div className="w-full bg-surface1 border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-4">
      
      {/* ------------------------ SIDE SWITCH ------------------------ */}
      <div className="flex items-center w-full bg-surface2 p-1 rounded-lg">
        <button
          onClick={() => setSide("buy")}
          className={cn(
            "flex-1 py-2 rounded-md text-sm font-medium",
            side === "buy"
              ? "bg-chartgreen text-black"
              : "text-[var(--text-secondary)]"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={cn(
            "flex-1 py-2 rounded-md text-sm font-medium",
            side === "sell"
              ? "bg-chartred text-white"
              : "text-[var(--text-secondary)]"
          )}
        >
          Sell
        </button>
      </div>

      {/* ------------------------ ORDER TYPE ------------------------ */}
      <div className="flex gap-3 text-sm">
        <button
          onClick={() => setType("market")}
          className={cn(
            type === "market"
              ? "text-accent font-semibold"
              : "text-[var(--text-secondary)]"
          )}
        >
          Market
        </button>
        <button
          onClick={() => setType("limit")}
          className={cn(
            type === "limit"
              ? "text-accent font-semibold"
              : "text-[var(--text-secondary)]"
          )}
        >
          Limit
        </button>
      </div>

      {/* ------------------------ LIMIT PRICE ------------------------ */}
      {type === "limit" && (
        <div>
          <label className="text-xs text-[var(--text-secondary)]">
            Limit Price (USDT)
          </label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-surface3 border border-[var(--border-color)]"
            placeholder="0.00"
          />
        </div>
      )}

      {/* ------------------------ AMOUNT ------------------------ */}
      <div>
        <label className="text-xs text-[var(--text-secondary)]">
          Amount ({marketId.replace("USDT", "")})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-surface3 border border-[var(--border-color)]"
          placeholder="0.00"
        />
      </div>

      {/* ------------------------ SLIDER ------------------------ */}
      <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
        {[25, 50, 75, 100].map((p) => (
          <button
            key={p}
            onClick={() => setPercent(p)}
            className="px-2 py-1 hover:text-accent"
          >
            {p}%
          </button>
        ))}
      </div>

      {/* ------------------------ TOTAL ------------------------ */}
      <div>
        <label className="text-xs text-[var(--text-secondary)]">
          Total (USDT)
        </label>
        <input
          type="text"
          readOnly
          value={total}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-surface3 border border-[var(--border-color)] opacity-80"
        />
      </div>

      {/* ------------------------ SUBMIT ------------------------ */}
      <button
        onClick={submit}
        className={cn(
          "w-full py-3 rounded-lg text-sm font-semibold mt-2",
          side === "buy"
            ? "bg-chartgreen text-black"
            : "bg-chartred text-white"
        )}
      >
        {side === "buy" ? "Buy" : "Sell"} {marketId.replace("USDT", "")}
      </button>
    </div>
  );
}
