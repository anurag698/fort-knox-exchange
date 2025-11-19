"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Trade = {
  id: string;
  pair: string;
  side: "buy" | "sell";
  price: number;
  qty: number;
  fee: number;
  feeAsset: string;
  timestamp: number;
  type: "market" | "limit" | "stop-limit";
};

export default function TradeHistoryPanel({ pair }: { pair: string }) {
  // Temporary mock data — replace with your backend later
  const [trades, setTrades] = useState<Trade[]>([
    {
      id: "t1",
      pair,
      side: "buy",
      price: 62210.5,
      qty: 0.24,
      fee: 0.00012,
      feeAsset: "BTC",
      timestamp: Date.now() - 200000,
      type: "market",
    },
    {
      id: "t2",
      pair,
      side: "sell",
      price: 63080.35,
      qty: 0.15,
      fee: 9.2,
      feeAsset: "USDT",
      timestamp: Date.now() - 300000,
      type: "limit",
    },
  ]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour12: false })
    );
  };

  return (
    <div className="p-4 text-[var(--text-primary)]">
      {/* HEADER */}
      <div className="pb-3 border-b border-[var(--border-color)]">
        <h2 className="text-sm font-semibold">Trade History</h2>
      </div>

      {/* TABLE */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              <th className="py-2 text-left">Pair</th>
              <th className="text-left">Type</th>
              <th className="text-left">Side</th>
              <th className="text-right">Price</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Total</th>
              <th className="text-right">Fee</th>
              <th className="text-right">Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {trades.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-center text-[var(--text-secondary)]"
                >
                  No trade history found
                </td>
              </tr>
            )}

            {trades.map((t) => (
              <tr
                key={t.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition"
              >
                <td className="py-2">{t.pair}</td>

                <td className="text-left capitalize text-[var(--text-secondary)]">
                  {t.type.replace("-", " ")}
                </td>

                <td
                  className={cn(
                    "font-medium capitalize",
                    t.side === "buy" ? "text-[#1AC186]" : "text-[#F54E5D]"
                  )}
                >
                  {t.side}
                </td>

                <td className="text-right">{t.price.toFixed(2)}</td>

                <td className="text-right">{t.qty.toFixed(4)}</td>

                <td className="text-right">
                  {(t.qty * t.price).toFixed(2)}
                </td>

                <td className="text-right text-[var(--text-secondary)]">
                  {t.fee} {t.feeAsset}
                </td>

                <td className="text-right text-[var(--text-secondary)]">
                  {formatTime(t.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
