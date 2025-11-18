'use client';
import React, { useEffect, useRef } from 'react';

// If you have TradingView or lightweight-charts, replace the inner div with your chart component.
export default function ChartArea({ marketId }: { marketId: string }) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // initialize your chart here (TradingView/lightweight-charts)
    // Example: mount TradingView or lightweight-charts and resize on container size
    const el = chartRef.current;
    if (!el) return;

    // placeholder styling (so it looks like real chart)
    el.style.background = 'linear-gradient(180deg,#07131a 0%, #07161c 100%)';
  }, [marketId]);

  return (
    <div className="w-full h-full relative">
      {/* top toolbar inside chart — render as absolute so it doesn't change layout */}
      <div className="absolute top-3 left-3 z-30 pointer-events-auto">
        <div className="bg-[#08121b] px-3 py-2 rounded-md shadow">1M 5M 15M 1H</div>
      </div>

      {/* place chart here */}
      <div ref={chartRef} className="h-full w-full" />

    </div>
  );
}
