
"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketListItem({ market, ticker, onClick }) {
  const price = ticker?.c ?? "--";
  const percent = ticker?.P ?? "--";
  const isUp = percent !== "--" && parseFloat(percent) >= 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 flex items-center justify-between rounded-md transition",
        "hover:bg-[var(--bg-primary)]"
      )}
    >
      {/* Left Side: Symbol + Favorite */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1">
          <span className="font-medium text-[var(--text-primary)]">
            {market.symbol}
          </span>
          {market.isFavorite && (
            <Star size={12} className="text-[var(--brand-gold)]" />
          )}
        </div>

        <span className="text-xs text-[var(--text-secondary)]">
          {market.baseAsset}/{market.quoteAsset}
        </span>
      </div>

      {/* Right Side: Prices */}
      <div className="flex flex-col text-right">
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {price}
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            isUp ? "text-[#1AC186]" : "text-[#F54E5D]"
          )}
        >
          {percent === "--" ? "--" : `${percent}%`}
        </span>
      </div>
    </button>
  );
}
