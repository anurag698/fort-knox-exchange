"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useMarketDataStore } from "@/stores/market-data-store"; // for mark price
import { X } from "lucide-react";

type Position = {
  id: string;
  pair: string;
  size: number;
  entryPrice: number;
  side: "long" | "short";
};

export default function PositionsPanel({ pair }: { pair: string }) {
  const { ticker } = useMarketDataStore(); // to read the live mark price
  const markPrice = ticker?.c ? Number(ticker.c) : null;

  // Local mock positions (replace with your backend later)
  const [positions, setPositions] = useState<Position[]>([
    {
      id: "pos1",
      pair,
      size: 0.54,
      entryPrice: 62250.0,
      side: "long",
    },
  ]);

  const closePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const calcPnl = (pos: Position) => {
    if (!markPrice) return { pnl: 0, roe: 0 };

    const diff =
      pos.side === "long"
        ? markPrice - pos.entryPrice
        : pos.entryPrice - markPrice;

    const pnl = diff * pos.size;
    const roe = (diff / pos.entryPrice) * 100;

    return { pnl, roe };
  };

  return (
    <div className="p-4 text-[var(--text-primary)]">
      {/* Header */}
      <div className="pb-3 border-b border-[var(--border-color)]">
        <h2 className="text-sm font-semibold">Positions</h2>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              <th className="py-2 text-left">Pair</th>
              <th className="text-right">Size</th>
              <th className="text-right">Entry</th>
              <th className="text-right">Mark</th>
              <th className="text-right">PnL</th>
              <th className="text-right">ROE%</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {positions.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-6 text-[var(--text-secondary)]"
                >
                  No active positions
                </td>
              </tr>
            )}

            {positions.map((pos) => {
              const { pnl, roe } = calcPnl(pos);

              return (
                <tr
                  key={pos.id}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition"
                >
                  <td className="py-2">
                    <span className="font-medium">{pos.pair}</span>
                    <span
                      className={cn(
                        "ml-2 px-1.5 py-0.5 rounded text-[10px]",
                        pos.side === "long"
                          ? "text-[#1AC186] bg-[#1ac18522]"
                          : "text-[#F54E5D] bg-[#f54e5d22]"
                      )}
                    >
                      {pos.side.toUpperCase()}
                    </span>
                  </td>

                  <td className="text-right">{pos.size}</td>
                  <td className="text-right">{pos.entryPrice.toFixed(2)}</td>
                  <td className="text-right">
                    {markPrice ? markPrice.toFixed(2) : "--"}
                  </td>

                  <td
                    className={cn(
                      "text-right font-medium",
                      pnl >= 0 ? "text-[#1AC186]" : "text-[#F54E5D]"
                    )}
                  >
                    {pnl.toFixed(2)}
                  </td>

                  <td
                    className={cn(
                      "text-right font-medium",
                      roe >= 0 ? "text-[#1AC186]" : "text-[#F54E5D]"
                    )}
                  >
                    {roe.toFixed(2)}%
                  </td>

                  <td className="text-right">
                    <button
                      onClick={() => closePosition(pos.id)}
                      className="p-1 rounded hover:bg-[var(--border-color)] transition"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
