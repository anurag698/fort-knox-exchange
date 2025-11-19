
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type AssetBalance = {
  asset: string;
  balance: number;
  available: number;
  inOrder: number;
  priceUSDT: number; // convert total to USDT
};

export default function AssetsBalancePanel() {
  // Temporary mock data — you can replace with backend API later
  const [balances, setBalances] = useState<AssetBalance[]>([
    {
      asset: "BTC",
      balance: 0.52,
      available: 0.41,
      inOrder: 0.11,
      priceUSDT: 63000, // mark price (should be live later)
    },
    {
      asset: "USDT",
      balance: 1200,
      available: 1150,
      inOrder: 50,
      priceUSDT: 1,
    },
    {
      asset: "ETH",
      balance: 1.42,
      available: 1.42,
      inOrder: 0,
      priceUSDT: 3200,
    },
  ]);

  return (
    <div className="p-4 text-[var(--text-primary)]">
      {/* HEADER */}
      <div className="pb-3 border-b border-[var(--border-color)]">
        <h2 className="text-sm font-semibold">Assets Balance</h2>
      </div>

      {/* TABLE */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              <th className="py-2 text-left">Asset</th>
              <th className="text-right">Balance</th>
              <th className="text-right">Available</th>
              <th className="text-right">In Order</th>
              <th className="text-right">Value (USDT)</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {balances.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 text-center text-[var(--text-secondary)]"
                >
                  No assets found
                </td>
              </tr>
            )}

            {balances.map((b) => (
              <tr
                key={b.asset}
                className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition"
              >
                <td className="py-2">{b.asset}</td>

                <td className="text-right">{b.balance.toFixed(8)}</td>

                <td className="text-right">{b.available.toFixed(8)}</td>

                <td className="text-right text-[var(--text-secondary)]">
                  {b.inOrder.toFixed(8)}
                </td>

                <td className="text-right">
                  {(b.balance * b.priceUSDT).toFixed(2)}
                </td>

                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button className="px-2 py-1 rounded-md text-xs bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-hover)] transition">
                      Deposit
                    </button>
                    <button className="px-2 py-1 rounded-md text-xs bg-[var(--brand-gold)] text-black hover:bg-[var(--brand-gold-hover)] transition">
                      Withdraw
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
