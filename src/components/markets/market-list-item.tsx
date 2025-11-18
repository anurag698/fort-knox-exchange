"use client";

import Link from "next/link";
import { Sparkline } from "@/components/trade/sparkline";
import { cn } from "@/lib/utils";

export function MarketListItem({ market }: { market: any }) {
  if (!market.marketData) return null;
    
  const changeColor =
    market.marketData.priceChangePercent > 0 ? "text-green-400" : "text-red-400";
  
  const price = market.marketData.price.toFixed(market.pricePrecision || 2);

  // Generate mock sparkline data if not present
  const sparklineData = market.marketData.sparkline ?? Array.from({length: 30}, () => market.marketData.price * (1 + (Math.random() - 0.5) * 0.05));


  return (
    <Link
      href={`/trade/${market.id}`}
      className={cn(
        "grid grid-cols-12 items-center gap-2 px-3 py-2",
        "hover:bg-[#1a1d21] transition-colors cursor-pointer"
      )}
    >
      <div className="flex flex-col col-span-4">
        <span className="font-medium text-sm text-white">{market.id.replace('-','/')}</span>
        <span className="text-xs text-neutral-500">
          Vol: {(market.marketData.volume / 1000000).toFixed(2)}M
        </span>
      </div>

      <div className="col-span-4 flex justify-center">
         <Sparkline data={sparklineData} />
      </div>

      <div className="flex flex-col items-end col-span-4">
        <span className="text-sm text-white font-mono">{price}</span>
        <span className={cn("text-xs font-mono", changeColor)}>
          {market.marketData.priceChangePercent.toFixed(2)}%
        </span>
      </div>
    </Link>
  );
}
