"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function OrderForm({ pair }: { pair: string }) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"limit" | "market" | "stop">("limit");

  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [triggerPrice, setTriggerPrice] = useState("");

  const quote = pair.split("-")[1];
  const base = pair.split("-")[0];

  const total = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(6) : "--";

  return (
    <div className="flex flex-col h-full p-4 bg-[var(--bg-card)] text-[var(--text-primary)]">

      {/* ------------------- SIDE SWITCH (Buy/Sell) ------------------- */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSide("buy")}
          className={cn(
            "flex-1 py-2 rounded-md text-sm font-semibold",
            side === "buy"
              ? "bg-[#1AC186]/20 text-[#1AC186] border border-[#1AC186]"
              : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]"
          )}
        >
          Buy
        </button>

        <button
          onClick={() => setSide("sell")}
          className={cn(
            "flex-1 py-2 rounded-md text-sm font-semibold",
            side === "sell"
              ? "bg-[#F54E5D]/20 text-[#F54E5D] border border-[#F54E5D]"
              : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]"
          )}
        >
          Sell
        </button>
      </div>

      {/* ------------------- TYPE SWITCH ------------------- */}
      <div className="flex items-center gap-2 mb-4">
        {["limit", "market", "stop"].map((t) => (
          <button
            key={t}
            onClick={() => setType(t as any)}
            className={cn(
              "flex-1 py-2 rounded-md text-xs uppercase tracking-wider",
              type === t
                ? "text-[var(--brand-blue)] border-b-2 border-[var(--brand-blue)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ------------------- TRIGGER PRICE (STOP ORDERS) ------------------- */}
      {type === "stop" && (
        <div className="mb-4">
          <label className="text-xs text-[var(--text-secondary)]">Trigger Price ({quote})</label>
          <input
            value={triggerPrice}
            onChange={(e) => setTriggerPrice(e.target.value)}
            className="w-full px-3 py-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)]
                      text-[var(--text-primary)] outline-none"
            placeholder="0.00"
          />
        </div>
      )}

      {/* ------------------- PRICE (NOT SHOWN FOR MARKET) ------------------- */}
      {type !== "market" && (
        <div className="mb-4">
          <label className="text-xs text-[var(--text-secondary)]">Price ({quote})</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)]
                      text-[var(--text-primary)] outline-none"
            placeholder="0.00"
          />
        </div>
      )}

      {/* ------------------- AMOUNT ------------------- */}
      <div className="mb-4">
        <label className="text-xs text-[var(--text-secondary)]">Amount ({base})</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)]
                    text-[var(--text-primary)] outline-none"
          placeholder="0.00"
        />
      </div>

      {/* ------------------- PERCENTAGE BUTTONS ------------------- */}
      <div className="flex items-center justify-between mb-4">
        {[25, 50, 75, 100].map((p) => (
          <button
            key={p}
            onClick={() => {
              if (!price) return;
              const mockBalance = 1000; // TODO: Replace with real balance
              const qty = (mockBalance * (p / 100)) / parseFloat(price);
              setAmount(qty.toFixed(6));
            }}
            className="text-xs px-2 py-1 rounded-md bg-[var(--bg-primary)] text-[var(--text-secondary)]
                       border border-[var(--border-color)] hover:bg-[var(--bg-card)]"
          >
            {p}%
          </button>
        ))}
      </div>

      {/* ------------------- TOTAL ------------------- */}
      <div className="flex items-center justify-between text-sm mb-6">
        <span className="text-[var(--text-secondary)]">Total ({quote})</span>
        <span className="font-semibold text-[var(--text-primary)]">{total}</span>
      </div>

      {/* ------------------- SUBMIT BUTTON ------------------- */}
      <button
        className={cn(
          "w-full py-2 rounded-md text-sm font-semibold shadow-md transition",
          side === "buy"
            ? "bg-[#1AC186] text-white hover:bg-[#14996F]"
            : "bg-[#F54E5D] text-white hover:bg-[#D9414F]"
        )}
      >
        {side === "buy" ? "Buy" : "Sell"} {base}
      </button>
    </div>
  );
}
