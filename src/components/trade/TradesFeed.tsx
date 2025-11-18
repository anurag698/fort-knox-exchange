'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  trades: any[];
}

export default function TradesFeed({ trades }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current) {
      container.current.scrollTop = container.current.scrollHeight;
    }
  }, [trades]);

  return (
    <div className="bg-[#0d1117] border border-gray-800 rounded p-2 h-full flex flex-col">
      <h2 className="text-sm text-gray-400 mb-2">Recent Trades</h2>

      <div
        ref={container}
        className="flex-1 overflow-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-700"
      >
        {trades.slice(-40).map((t, i) => {
          const price = parseFloat(t.price);
          const qty = parseFloat(t.qty);

          const isBuy = t.side === 'buy';

          return (
            <div
              key={i}
              className="flex justify-between text-xs font-mono"
            >
              <span className={isBuy ? 'text-green-400' : 'text-red-400'}>
                {price.toFixed(2)}
              </span>
              <span className="text-gray-300">{qty.toFixed(3)}</span>
              <span className="text-gray-500">
                {new Date(t.time).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
