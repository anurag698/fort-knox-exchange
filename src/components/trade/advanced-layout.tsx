
'use client';

import React from 'react';
import CanvasDepthChart from '@/components/trade/canvas-depth-chart';
import FloatingOrderPanel from '@/components/trade/floating-order-panel';

export function AdvancedLayout({ marketId }: { marketId: string }) {
  return (
    <div className="w-full flex flex-col gap-4 trade-area">
      {/* Chart area — fixed height so nothing inside can change document flow */}
      <div className="relative w-full h-[420px] max-h-[420px] bg-[#07101a] rounded-lg overflow-hidden">
        {/* Canvas depth / chart fills the wrapper */}
        <div className="absolute inset-0">
          <CanvasDepthChart marketId={marketId} height={420} />
        </div>

        {/* Overlay container for interactive DOM elements (absolute) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Example: floating order panel — pointer-events-none on parent, but panel itself uses pointer-events-auto */}
          <div className="absolute left-6 top-6 z-50 pointer-events-auto">
            <FloatingOrderPanel marketId={marketId} />
          </div>

          {/* Example spot for tooltips/select overlays */}
          <div id="chart-overlays" className="absolute inset-0 pointer-events-none z-40" />
        </div>
      </div>

      {/* Below-chart content (open orders, trade list) — not part of the chart wrapper */}
      <div className="w-full">
        {/* Placeholder for other panels that belong to page flow */}
      </div>
    </div>
  );
}
