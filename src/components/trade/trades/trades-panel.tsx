"use client";

import { useMarketDataStore } from "@/state/market-data-store";
import { useMemo } from "react";

export default function TradesPanel() {
  const trades = useMarketDataStore((s) => s.trades) || [];

  const safeTrades = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    return trades.slice(0, 120); // render last 120
  }, [trades]);

  return (
    <div className="w-full h-full flex flex-col bg-surface1 border border-[var(--border-color)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-surface2 border-b border-[var(--border-color)] flex justify-between items-center">
        <span className="text-sm font-medium">Recent Trades</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {safeTrades.length === 0 ? (
          <div className="p-3 text-xs text-[var(--text-secondary)]">
            No trades available
          </div>
        ) : (
          safeTrades.map((t, i) => {
            const priceColor =
              t.side === "buy" ? "text-chartgreen" : "text-chartred";

            return (
              <div
                key={i}
                className="flex justify-between items-center px-3 py-[6px] text-xs border-b border-[var(--border-color)]"
              >
                <span className={priceColor}>{t.price.toFixed(2)}</span>
                <span className="text-[var(--text-secondary)]">
                  {t.volume.toFixed(4)}
                </span>
                <span className="text-[var(--text-secondary)]">
                  {new Date(t.ts).toLocaleTimeString()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
