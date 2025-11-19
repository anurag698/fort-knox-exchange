"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type AssetRow = {
  asset: string;
  balance: number;
  priceUSDT: number;
};

export default function PortfolioSummaryPanel() {
  // Temporary mock assets — replace with API data later
  const [assets] = useState<AssetRow[]>([
    { asset: "BTC", balance: 0.52, priceUSDT: 63000 },
    { asset: "ETH", balance: 1.42, priceUSDT: 3200 },
    { asset: "USDT", balance: 1200, priceUSDT: 1 },
    { asset: "SOL", balance: 18, priceUSDT: 140 },
  ]);

  // Compute total portfolio
  const totalUSDT = useMemo(
    () =>
      assets.reduce((sum, a) => sum + a.balance * a.priceUSDT, 0),
    [assets]
  );

  // Fake PnL (replace with backend later)
  const pnl24h = +((Math.random() * 2 - 1) * 2).toFixed(2); // -2% to +2%
  const pnl7d = +((Math.random() * 2 - 1) * 5).toFixed(2);

  // Pie slices (percentage)
  const slices = assets.map((a) => ({
    asset: a.asset,
    percentage: ((a.balance * a.priceUSDT) / totalUSDT) * 100,
  }));

  return (
    <div className="p-4 text-[var(--text-primary)]">
      {/* HEADER */}
      <div className="pb-3 border-b border-[var(--border-color)]">
        <h2 className="text-sm font-semibold">Portfolio Summary</h2>
      </div>

      {/* CONTENT */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT SIDE: TOTALS */}
        <div className="space-y-4">
          <div className="text-lg font-bold">
            Total Value: 
            <span className="text-[var(--brand-gold)] ml-2">
              {totalUSDT.toLocaleString()} USDT
            </span>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            
            {/* 24h PnL */}
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">24h PnL</span>
              <span
                className={cn(
                  "font-semibold",
                  pnl24h >= 0 ? "text-[#1AC186]" : "text-[#F54E5D]"
                )}
              >
                {pnl24h >= 0 ? "+" : ""}
                {pnl24h}%
              </span>
            </div>

            {/* 7d PnL */}
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">7d PnL</span>
              <span
                className={cn(
                  "font-semibold",
                  pnl7d >= 0 ? "text-[#1AC186]" : "text-[#F54E5D]"
                )}
              >
                {pnl7d >= 0 ? "+" : ""}
                {pnl7d}%
              </span>
            </div>

          </div>

          {/* QUICK ACTIONS */}
          <div className="flex gap-3 pt-3">
            <button className="px-3 py-2 rounded bg-[var(--brand-blue)] text-white text-xs">
              Deposit
            </button>
            <button className="px-3 py-2 rounded bg-[var(--brand-gold)] text-black text-xs">
              Withdraw
            </button>
            <button className="px-3 py-2 rounded border border-[var(--border-color)] text-xs">
              Transfer
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: PIE CHART */}
        <div className="flex justify-center items-center">
          <svg width="160" height="160" viewBox="0 0 32 32">
            {(() => {
              let cumulative = 0;
              return slices.map((slice, index) => {
                const start = cumulative;
                const end = cumulative + slice.percentage * 0.01 * 360;
                cumulative = end;

                const largeArc = end - start > 180 ? 1 : 0;

                // Convert to radians
                const startRad = (start - 90) * (Math.PI / 180);
                const endRad = (end - 90) * (Math.PI / 180);

                const x1 = 16 + 14 * Math.cos(startRad);
                const y1 = 16 + 14 * Math.sin(startRad);
                const x2 = 16 + 14 * Math.cos(endRad);
                const y2 = 16 + 14 * Math.sin(endRad);

                const colors = ["#1AC186", "#4D7CFE", "#E8B923", "#F54E5D"];

                return (
                  <path
                    key={index}
                    d={`M16 16 L ${x1} ${y1} A 14 14 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={colors[index % colors.length]}
                  />
                );
              });
            })()}
          </svg>
        </div>

      </div>
    </div>
  );
}
