// This component is the main client-side wrapper for the entire trading terminal.
// It manages the active mode (Advanced, Chart, Depth) and renders the appropriate layout.
'use client';

import { useState, useEffect } from 'react';
import { MarketHeader } from '@/components/trade/market-header';
import { ModeSwitcher, type TradeMode } from '@/components/trade/mode-switcher';
import { AdvancedLayout } from '@/components/trade/advanced-layout';
import { ChartLayout } from '@/components/trade/chart-layout';
import { DepthLayout } from '@/components/trade/depth-layout';
import { marketDataService } from '@/lib/market-data-service';

export default function TradePageClient({ marketId }: { marketId: string }) {
  const [mode, setMode] = useState<TradeMode>('Advanced');

  useEffect(() => {
    // Establish WebSocket connections for the given market
    const streams = [
      `depth`, // Real-time order book updates
      `trade`, // Real-time trades
      `ticker`, // Real-time ticker statistics
      `kline_1m`, // 1-minute candlesticks
    ];

    const symbol = marketId.replace('-', '').toLowerCase();
    marketDataService.connect(symbol, streams);

    // Clean up connections when the marketId changes or component unmounts
    return () => {
      marketDataService.disconnect();
    };
  }, [marketId]);

  return (
    <div className="flex h-full flex-col gap-4 bg-background p-4 text-foreground">
      {/* The header is always visible, regardless of the selected mode */}
      <MarketHeader marketId={marketId} />
      
      {/* The mode switcher allows users to toggle between different layouts */}
      <ModeSwitcher activeMode={mode} setMode={setMode} />

      {/* The main content area dynamically renders the layout based on the active mode */}
      <div className="flex-1 overflow-hidden">
        {mode === 'Advanced' && <AdvancedLayout marketId={marketId} />}
        {mode === 'Chart' && <ChartLayout marketId={marketId} />}
        {mode === 'Depth' && <DepthLayout marketId={marketId} />}
      </div>
    </div>
  );
}
