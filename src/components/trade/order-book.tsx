'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useMarketDataStore } from '@/lib/market-data-service';

interface Props {
  bids: any[];
  asks: any[];
}

function depthIntensity(amount: number, maxAmount: number) {
  if (maxAmount === 0) return 0;
  const percent = amount / maxAmount;
  return Math.min(percent * 100, 100);
}

export default function OrderBook({ bids, asks }: Props) {
  const isLoading = !bids || !asks || bids.length === 0 || asks.length === 0;
  const hoveredPrice = useMarketDataStore((s) => s.hoveredPrice);

  const maxBidVolume = isLoading ? 0 : Math.max(...bids.map((b: any) => parseFloat(b[1])));
  const maxAskVolume = isLoading ? 0 : Math.max(...asks.map((a: any) => parseFloat(a[1])));

  if (isLoading) {
    return (
      <div className="bg-[#0d1117] border border-gray-800 rounded p-2 h-full flex items-center justify-center text-gray-500">
        Loading order book…
      </div>
    );
  }

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded p-2 h-full flex flex-col">
      <h2 className="text-sm text-gray-400 mb-2">Order Book</h2>

      {/* Asks */}
      <div className="flex-1 flex flex-col-reverse gap-0.5 overflow-hidden">
        {asks.slice(0, 20).map((ask: any, i: number) => {
          const price = parseFloat(ask[0]);
          const volume = parseFloat(ask[1]);
          const intensity = depthIntensity(volume, maxAskVolume);
          const isHovered = hoveredPrice && Math.abs(hoveredPrice - price) < price * 0.0005;

          return (
            <div
              key={i}
              className={cn(
                "relative text-xs flex justify-between px-1",
                isHovered ? "bg-yellow-500/20" : ""
              )}
              style={{
                background: `linear-gradient(to left, rgba(239,68,68,0.25) ${intensity}%, transparent)`
              }}
              onMouseEnter={() => useMarketDataStore.getState().setHoveredPrice(price)}
            >
              <span className="text-red-400 font-mono z-10">{price.toFixed(2)}</span>
              <span className="text-gray-300 font-mono z-10">{volume.toFixed(3)}</span>
            </div>
          );
        })}
      </div>

      <div className="py-1 text-center text-lg font-bold border-y border-gray-800 my-1 flash-green flash-red">
        {bids.length > 0 && asks.length > 0 ? parseFloat(bids[0][0]).toFixed(2) : '...'}
      </div>

      {/* Bids */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
        {bids.slice(0, 20).map((bid: any, i: number) => {
          const price = parseFloat(bid[0]);
          const volume = parseFloat(bid[1]);
          const intensity = depthIntensity(volume, maxBidVolume);
          const isHovered = hoveredPrice && Math.abs(hoveredPrice - price) < price * 0.0005;

          return (
            <div
              key={i}
              className={cn(
                "relative text-xs flex justify-between px-1",
                 isHovered ? "bg-yellow-500/20" : ""
              )}
              style={{
                background: `linear-gradient(to left, rgba(34,197,94,0.25) ${intensity}%, transparent)`
              }}
              onMouseEnter={() => useMarketDataStore.getState().setHoveredPrice(price)}
            >
              <span className="text-green-400 font-mono z-10">{price.toFixed(2)}</span>
              <span className="text-gray-300 font-mono z-10">{volume.toFixed(3)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
