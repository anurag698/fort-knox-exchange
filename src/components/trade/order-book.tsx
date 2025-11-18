
'use client';

import React, { useMemo } from 'react';

interface Props {
  bids: any[];
  asks: any[];
}

export default function OrderBook({ bids, asks }: Props) {
  const isLoading = !bids || !asks || bids.length === 0 || asks.length === 0;

  if (isLoading) {
    return (
      <div className="bg-[#0d1117] border border-gray-800 rounded p-2 h-full flex items-center justify-center text-gray-500">
        Loading order book…
      </div>
    );
  }

  const maxBidVolume = Math.max(...bids.map((b: any) => parseFloat(b[1])));
  const maxAskVolume = Math.max(...asks.map((a: any) => parseFloat(a[1])));

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded p-2 h-full flex flex-col">
      <h2 className="text-sm text-gray-400 mb-2">Order Book</h2>

      {/* Asks */}
      <div className="flex-1 flex flex-col-reverse gap-0.5 overflow-hidden">
        {asks.slice(0, 20).map((ask: any, i: number) => {
          const price = parseFloat(ask[0]);
          const volume = parseFloat(ask[1]);
          const barWidth = (volume / maxAskVolume) * 100;

          return (
            <div key={i} className="relative text-xs flex justify-between px-1">
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-600/20"
                style={{ width: `${barWidth}%` }}
              />
              <span className="text-red-400 font-mono">{price.toFixed(2)}</span>
              <span className="text-gray-300 font-mono">{volume.toFixed(3)}</span>
            </div>
          );
        })}
      </div>

      <div className="py-1 text-center text-gray-500 text-xs border-y border-gray-800 my-1">
        SPREAD
      </div>

      {/* Bids */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
        {bids.slice(0, 20).map((bid: any, i: number) => {
          const price = parseFloat(bid[0]);
          const volume = parseFloat(bid[1]);
          const barWidth = (volume / maxBidVolume) * 100;

          return (
            <div key={i} className="relative text-xs flex justify-between px-1">
              <div
                className="absolute right-0 top-0 bottom-0 bg-green-600/20"
                style={{ width: `${barWidth}%` }}
              />
              <span className="text-green-400 font-mono">{price.toFixed(2)}</span>
              <span className="text-gray-300 font-mono">{volume.toFixed(3)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
