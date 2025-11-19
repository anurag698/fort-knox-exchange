// src/components/trade/markets/market-list-item.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Market } from "@/lib/types";
import { useMarketDataStore } from '@/lib/market-data-service';
import { useEffect } from 'react';

interface Props {
  market: Market;
  active?: boolean;
  onClick?: () => void;
}

export default function MarketListItem({ market, active, onClick }: Props) {
  const ticker = useMarketDataStore(state => state.ticker);
  
  const marketSymbol = market.id.replace('-', '');
  
  // Determine if this item's ticker is the one currently in the store
  const isCurrentTicker = ticker && ticker.s === marketSymbol;
  
  const lastPrice = isCurrentTicker ? parseFloat(ticker.c).toFixed(market.pricePrecision) : '...';
  const priceChangePercent = isCurrentTicker ? parseFloat(ticker.P) : 0;
  
  const priceChangeColor = priceChangePercent >= 0 ? "text-[#1AC186]" : "text-[#F54E5D]";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 flex items-center justify-between rounded-md transition-colors",
        active ? "bg-[#131D2E]/70" : "hover:bg-[#131D2E]/40"
      )}
    >
      <div className="flex flex-col text-left">
        <span className="text-sm font-medium text-white">
          {market.baseAssetId}/{market.quoteAssetId}
        </span>
        <span className="text-xs text-[#A9B1C6]">
          Vol: ...
        </span>
      </div>

      <div className="flex flex-col text-right">
        <span className="text-sm font-semibold text-white">
          {lastPrice}
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            priceChangeColor
          )}
        >
          {priceChangePercent.toFixed(2)}%
        </span>
      </div>
    </button>
  );
}
