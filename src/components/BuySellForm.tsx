"use client";

import { useState } from "react";

export default function BuySellForm({ symbol }: { symbol: string }) {
  const [side, setSide] = useState<"buy" | "sell">("buy");

  const isBuy = side === "buy";
  const base = symbol.slice(0, -4).toUpperCase();
  const quote = symbol.slice(-4).toUpperCase();

  return (
    <div className="bg-[#0e1117] p-4 rounded-xl text-sm border border-gray-800">

      {/* Toggle Buy / Sell */}
      <div className="flex gap-2 mb-4">
        <button
          className={`flex-1 py-2 rounded font-semibold ${
            isBuy
              ? "bg-green-600/30 text-green-400"
              : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setSide("buy")}
        >
          Buy
        </button>

        <button
          className={`flex-1 py-2 rounded font-semibold ${
            !isBuy
              ? "bg-red-600/30 text-red-400"
              : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setSide("sell")}
        >
          Sell
        </button>
      </div>

      {/* Price Input */}
      <div className="mb-3">
        <label className="text-gray-400">Price ({quote})</label>
        <input
          type="number"
          step="0.0001"
          className="w-full mt-1 bg-gray-800 p-2 rounded outline-none"
          placeholder="0.00"
        />
      </div>

      {/* Amount Input */}
      <div className="mb-3">
        <label className="text-gray-400">Amount ({base})</label>
        <input
          type="number"
          step="0.0001"
          className="w-full mt-1 bg-gray-800 p-2 rounded outline-none"
          placeholder="0.00"
        />
      </div>

      {/* Total Display (UI only) */}
      <div className="mt-4 text-gray-400 text-xs">
        Total = Price × Amount
      </div>

      {/* Submit Button */}
      <button
        className={`w-full mt-4 py-2 rounded font-bold ${
          isBuy
            ? "bg-green-500 hover:bg-green-400 text-black"
            : "bg-red-500 hover:bg-red-400 text-black"
        }`}
      >
        {isBuy ? "Buy" : "Sell"} {base}
      </button>
    </div>
  );
}
