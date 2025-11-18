"use client";

import { useState, useEffect } from "react";

export function PnlCalculator({ price }: { price?: number }) {
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [size, setSize] = useState("");

  const pnl =
    entry && exit && size
      ? ((parseFloat(exit) - parseFloat(entry)) * parseFloat(size)).toFixed(2)
      : "0.00";

  return (
    <div className="space-y-3 text-sm text-neutral-200">
      <div className="flex justify-between">
        <span>Last Price:</span>
        <span className="text-yellow-400">{price}</span>
      </div>

      <div className="space-y-2">
        <input
          placeholder="Entry Price"
          className="w-full bg-[#1a1d21] px-2 py-1 rounded"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
        />

        <input
          placeholder="Exit Price"
          className="w-full bg-[#1a1d21] px-2 py-1 rounded"
          value={exit}
          onChange={(e) => setExit(e.target.value)}
        />

        <input
          placeholder="Size"
          className="w-full bg-[#1a1d21] px-2 py-1 rounded"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />
      </div>

      <div className="flex justify-between pt-2 border-t border-neutral-700">
        <span>PnL:</span>
        <span className={parseFloat(pnl) >= 0 ? "text-green-400" : "text-red-400"}>
          {pnl}
        </span>
      </div>
    </div>
  );
}
