
'use client';

import { useEffect, useState } from 'react';
import { ModeSwitcher, type TradeMode } from '@/components/trade/mode-switcher';
import { AdvancedLayout } from '@/app/trade/[marketId]/advanced-layout';
import { ChartLayout } from '@/components/trade/chart-layout';
import { DepthLayout } from '@/components/trade/depth-layout';
import marketDataService from '@/services/market-data-service';
import { useMarketDataStore } from '@/state/market-data-store';
import { MarketHeader } from '@/components/trade/market-header';
import FloatingOrderPanel from '@/components/trade/floating-order-panel';
import { Hotkeys } from '@/components/trade/hotkeys';
import { UserTrades } from '@/components/trade/user-trades';

interface Props {
  marketId: string;
}

export default function TradePageClient({ marketId }: Props) {
  const [mode, setMode] = useState<TradeMode>('Advanced');
  const [showOrderPanel, setShowOrderPanel] = useState(true);

  useEffect(() => {
    marketDataService.startFeed(marketId);
    return () => {
      marketDataService.stopFeed();
    };
  }, [marketId]);

  return (
    <div className="flex flex-col bg-[#05070a] text-gray-200 h-full trade-area">

      {showOrderPanel && (
        <FloatingOrderPanel marketId={marketId} />
      )}

      <Hotkeys
        toggleOrderPanel={() => setShowOrderPanel((s) => !s)}
        goToChart={() => setMode("Chart")}
        goToOrderbook={() => setMode("Advanced")}
      />

      <MarketHeader marketId={marketId} />

      <ModeSwitcher activeMode={mode} setMode={setMode} />

      <div className="relative flex-1 mt-2 min-h-[300px] md:min-h-[400px]">
        {/* This is the root for all overlay elements like tooltips, modals, and floating panels */}
        <div id="trade-overlay-root" className="absolute inset-0 pointer-events-none z-50" />
        
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

       <div className="mt-6 flex flex-col gap-6">
        <UserTrades marketId={marketId} />
       </div>
    </div>
  );
}
