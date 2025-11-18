
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useMarketDataStore } from '@/lib/market-data-service';

function depthIntensity(amount: number, maxAmount: number) {
  if (maxAmount === 0) return 0;
  const percent = amount / maxAmount;
  return Math.min(percent * 100, 100);
}

export default function OrderBook() {
  const bids = useMarketDataStore((s) => s.bids);
  const asks = useMarketDataStore((s) => s.asks);
  const isLoading = !bids || !asks || bids.length === 0 || asks.length === 0;
  const hoveredPrice = useMarketDataStore((s) => s.hoveredPrice);

  const maxBidVolume = isLoading ? 0 : Math.max(...bids.map((b: any) => b.size));
  const maxAskVolume = isLoading ? 0 : Math.max(...asks.map((a: any) => a.size));

  if (isLoading) {
    return (
      <div className="bg-[#0d1117] border border-gray-800 rounded p-2 h-full flex items-center justify-center text-gray-500">
        Loading order book…
      </div>
    );
  }

  const renderRow = (row: any, side: 'bid' | 'ask') => {
    const { price, size, isWall } = row;
    const maxVolume = side === 'bid' ? maxBidVolume : maxAskVolume;
    const intensity = depthIntensity(size, maxVolume);
    const isHovered = hoveredPrice && Math.abs(hoveredPrice - price) < price * 0.0005;
    const colorClass = side === 'bid' ? 'text-green-400' : 'text-red-400';
    const bgGradient =
      side === 'bid'
        ? `linear-gradient(to left, rgba(34,197,94,0.25) ${intensity}%, transparent)`
        : `linear-gradient(to left, rgba(239,68,68,0.25) ${intensity}%, transparent)`;
    
    return (
      <div
        key={`${side}-${price}`}
        className={cn(
          "relative text-xs flex justify-between px-1",
          isHovered ? "bg-yellow-500/20" : "",
          isWall && (side === 'bid' ? "bg-[#0e4a32]" : "bg-[#4a0e0e]")
        )}
        style={{ background: bgGradient }}
        onMouseEnter={() => useMarketDataStore.getState().setHoveredPrice(price)}
      >
        <span className={cn("font-mono z-10", colorClass)}>{price.toFixed(2)}</span>
        <span className="text-gray-300 font-mono z-10">{size.toFixed(3)}</span>
        {isWall && (
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-yellow-400/70"></div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded p-2 h-full flex flex-col">
      <h2 className="text-sm text-gray-400 mb-2">Order Book</h2>

      {/* Asks */}
      <div className="flex-1 flex flex-col-reverse gap-0.5 overflow-hidden">
        {asks.slice(0, 20).map((ask) => renderRow(ask, 'ask'))}
      </div>

      <div className="py-1 text-center text-lg font-bold border-y border-gray-800 my-1">
        {bids.length > 0 ? bids[0].price.toFixed(2) : '...'}
      </div>

      {/* Bids */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
        {bids.slice(0, 20).map((bid) => renderRow(bid, 'bid'))}
      </div>
    </div>
  );
}
