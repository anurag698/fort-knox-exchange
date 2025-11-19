"use client";

import React from "react";

const SAMPLE_MARKETS = [
  "BTC-USDT",
  "ETH-USDT",
  "NOMOX-USDT",
  "POL-USDT",
];

export default function MarketSwitcher({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 bg-transparent border border-[var(--border,#23313f)] rounded text-white"
    >
      {SAMPLE_MARKETS.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
