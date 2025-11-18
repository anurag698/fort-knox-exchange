'use client';

//
// This is the MASTER controller for all 3 Pro Modes.
// It manages:
//
//  - MarketDataService (WS engine)
//  - Mode switching (Advanced / Chart / Depth)
//  - Zustand data bindings
//  - Passing real-time data into layouts
//

import { useEffect, useState } from 'react';
import { ModeSwitcher, type TradeMode } from '@/components/trade/mode-switcher';
import { AdvancedLayout } from '@/components/trade/advanced-layout';
import { ChartLayout } from '@/components/trade/chart-layout';
import { DepthLayout } from '@/components/trade/depth-layout';

import { MarketDataService, useMarketDataStore } from '@/lib/market-data-service';
import { MarketHeader } from '@/components/trade/market-header';

interface Props {
  marketId: string;
}

export default function TradePageClient({ marketId }: Props) {
  const [mode, setMode] = useState<TradeMode>('Advanced');

  // Zustand real-time store
  const ticker = useMarketDataStore((s) => s.ticker);
  const depth = useMarketDataStore((s) => s.depth);
  const trades = useMarketDataStore((s) => s.trades);
  const klines = useMarketDataStore((s) => s.klines);

  //
  // Connect WebSocket streams when marketId changes
  //
  useEffect(() => {
    const symbol = marketId.replace('-', '').toLowerCase();
    const svc = MarketDataService.get(symbol);
    svc.connect();

    return () => {
      svc.disconnect();
    };
  }, [marketId]);

  return (
    <div className="flex flex-col bg-[#05070a] text-gray-200 h-full">

      {/* TOP HEADER — Pair ticker, last price, 24h info */}
      <MarketHeader marketId={marketId} />

      {/* MODE SWITCHER BAR */}
      <ModeSwitcher activeMode={mode} setMode={setMode} />

      {/* MAIN LAYOUTS */}
      {mode === 'Advanced' && (
        <AdvancedLayout marketId={marketId} />
      )}

      {mode === 'Chart' && (
        <ChartLayout marketId={marketId} />
      )}

      {mode === 'Depth' && (
        <DepthLayout marketId={marketId} />
      )}
    </div>
  );
}
