'use client';

import React from 'react';
import CanvasDepthChart from '@/components/trade/canvas-depth-chart';

export function DepthLayout({ marketId }: { marketId: string }) {
  return (
    <div className="w-full h-[360px] overflow-hidden bg-[#0b0b0b] border border-[#1a1a1a] rounded relative">
      <CanvasDepthChart marketId={marketId} height={360} />
    </div>
  );
}
