"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  symbol: string;
  price: number;
  amount: number;
  side: "buy" | "sell";
  status: "open" | "closed";
  time: string;
};

export default function PositionsPanel() {
  const [tab, setTab] = useState<"open" | "history" | "trade">("open");

  // -----------------------------
  // Dummy local data (safe)
  // -----------------------------
  const openOrders: Order[] = [
    {
      id: "1",
      symbol: "BTCUSDT",
      price: 43000,
      amount: 0.005,
      side: "buy",
      status: "open",
      time: "2025-01-12 14:22",
    },
  ];

  const orderHistory: Order[] = [
    {
      id: "2",
      symbol: "BTCUSDT",
      price: 42500,
      amount: 0.01,
      side: "sell",
      status: "closed",
      time: "2025-01-10 19:45",
    },
  ];

  const tradeHistory: Order[] = [
    {
      id: "3",
      symbol: "BTCUSDT",
      price: 42000,
      amount: 0.02,
      side: "buy",
      status: "closed",
      time: "2025-01-09 08:32",
    },
  ];

  const activeList =
    tab === "open" ? openOrders : tab === "history" ? orderHistory : tradeHistory;

  return (
    <div className="w-full h-full bg-surface1 border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col">
      {/* ------------------ TOP TABS ------------------ */}
      <div className="flex text-sm border-b border-[var(--border-color)]">
        <button
          className={cn(
            "flex-1 py-2",
            tab === "open"
              ? "text-accent font-semibold"
              : "text-[var(--text-secondary)]"
          )}
          onClick={() => setTab("open")}
        >
          Open Orders
        </button>

        <button
          className={cn(
            "flex-1 py-2",
            tab === "history"
              ? "text-accent font-semibold"
              : "text-[var(--text-secondary)]"
          )}
          onClick={() => setTab("history")}
        >
          Order History
        </button>

        <button
          className={cn(
            "flex-1 py-2",
            tab === "trade"
              ? "text-accent font-semibold"
              : "text-[var(--text-secondary)]"
          )}
          onClick={() => setTab("trade")}
        >
          Trade History
        </button>
      </div>

      {/* ------------------ TABLE HEADER ------------------ */}
      <div className="grid grid-cols-6 text-xs px-3 py-2 border-b border-[var(--border-color)] text-[var(--text-secondary)]">
        <div>Pair</div>
        <div>Side</div>
        <div>Price</div>
        <div>Amount</div>
        <div>Status</div>
        <div>Time</div>
      </div>

      {/* ------------------ TABLE ROWS ------------------ */}
      <div className="flex-1 overflow-auto text-xs">
        {activeList.length === 0 ? (
          <div className="p-4 text-[var(--text-secondary)]">
            No records found.
          </div>
        ) : (
          activeList.map((o) => (
            <div
              key={o.id}
              className="grid grid-cols-6 px-3 py-2 border-b border-[var(--border-color)] text-[var(--text-primary)]"
            >
              <div>{o.symbol}</div>

              <div
                className={o.side === "buy" ? "text-chartgreen" : "text-chartred"}
              >
                {o.side.toUpperCase()}
              </div>

              <div>{o.price}</div>
              <div>{o.amount}</div>

              <div
                className={
                  o.status === "open"
                    ? "text-accent"
                    : "text-[var(--text-secondary)]"
                }
              >
                {o.status}
              </div>

              <div>{o.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
