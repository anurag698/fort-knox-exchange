
'use client';

import React, { useEffect, useRef } from 'react';
import { useMarketDataStore } from '@/lib/market-data-service';

export function RecentTrades({ marketId }: { marketId: string }) {
  const trades = useMarketDataStore((s) => s.trades);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // only auto-scroll if user is already at bottom
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // disable browser scroll anchoring for this container
    node.style.overflowAnchor = 'none';

    const isAtBottom = Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop) < 6;
    if (isAtBottom) {
      // use scrollTop (avoid smooth scroll behaviors)
      node.scrollTop = node.scrollHeight;
    }
  }, [trades]);

  return (
    <div ref={containerRef} className="w-full max-h-[320px] overflow-auto bg-transparent">
      <ul className="space-y-1 py-2">
        {trades?.map((t: any, i: number) => (
          <li key={i} className="text-sm text-[#9aa3ad] flex justify-between px-2">
            <span className={t.m ? 'text-red-400' : 'text-green-400'}>{parseFloat(t.p).toFixed(2)}</span>
            <span className="opacity-80">{parseFloat(t.q).toFixed(4)}</span>
            <span className="text-xs opacity-60">{new Date(t.T).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
