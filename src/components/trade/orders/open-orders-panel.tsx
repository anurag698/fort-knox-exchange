"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type Order = {
  id: string;
  pair: string;
  type: "limit" | "market" | "stop-limit";
  side: "buy" | "sell";
  price: number;
  stopPrice?: number;
  amount: number;
  filled: number; // 0 to 1 (0–100%)
  timestamp: number;
};

export default function OpenOrdersPanel({ pair }: { pair: string }) {
  // Local mock data — replace with backend/live API later
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ord1",
      pair,
      type: "limit",
      side: "buy",
      price: 62000,
      amount: 0.5,
      filled: 0.0,
      timestamp: Date.now(),
    },
    {
      id: "ord2",
      pair,
      type: "stop-limit",
      side: "sell",
      price: 63000,
      stopPrice: 62800,
      amount: 0.3,
      filled: 0.15,
      timestamp: Date.now(),
    },
  ]);

  const cancelOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div className="p-4 text-[var(--text-primary)]">
      {/* Header */}
      <div className="pb-3 border-b border-[var(--border-color)]">
        <h2 className="text-sm font-semibold">Open Orders</h2>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              <th className="py-2 text-left">Pair</th>
              <th className="text-left">Type</th>
              <th className="text-right">Price</th>
              <th className="text-right">Stop</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Filled</th>
              <th className="text-right">Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-6 text-[var(--text-secondary)]"
                >
                  No open orders
                </td>
              </tr>
            )}

            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition"
              >
                <td className="py-2">
                  <span className="font-medium">{o.pair}</span>
                  <span
                    className={cn(
                      "ml-2 px-1.5 py-0.5 rounded text-[10px]",
                      o.side === "buy"
                        ? "text-[#1AC186] bg-[#1ac18522]"
                        : "text-[#F54E5D] bg-[#f54e5d22]"
                    )}
                  >
                    {o.side.toUpperCase()}
                  </span>
                </td>

                <td className="text-left capitalize text-[var(--text-secondary)]">
                  {o.type.replace("-", " ")}
                </td>

                <td className="text-right">
                  {o.type === "market" ? "--" : o.price.toFixed(2)}
                </td>

                <td className="text-right">
                  {o.type === "stop-limit" ? o.stopPrice?.toFixed(2) : "--"}
                </td>

                <td className="text-right">{o.amount}</td>

                <td className="text-right text-[var(--text-secondary)]">
                  {(o.filled * 100).toFixed(0)}%
                </td>

                <td className="text-right">
                  {o.filled === 1 ? (
                    <span className="text-[#1AC186]">Filled</span>
                  ) : (
                    <span className="text-[var(--text-secondary)]">
                      Pending
                    </span>
                  )}
                </td>

                <td className="text-right">
                  <button
                    onClick={() => cancelOrder(o.id)}
                    className="p-1 rounded hover:bg-[var(--border-color)] transition"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
