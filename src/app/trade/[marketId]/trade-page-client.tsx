
'use client';

import { useEffect, useState } from 'react';
import { ModeSwitcher, type TradeMode } from '@/components/trade/mode-switcher';
import { AdvancedLayout } from '@/app/trade/[marketId]/advanced-layout';
import { ChartLayout } from '@/components/trade/chart-layout';
import { DepthLayout } from '@/components/trade/depth-layout';
import { MarketDataService, useMarketDataStore } from '@/lib/market-data-service';
import { MarketHeader } from '@/components/trade/market-header';
import { FloatingOrderPanel } from '@/components/trade/floating-order-panel';
import { OrderFormAdvanced } from '@/components/trade/order-form-advanced';
import { PnlCalculator } from '@/components/trade/pnl-calculator';
import { Hotkeys } from '@/components/trade/hotkeys';
import { Balances } from '@/components/trade/balances';
import { RecentTrades } from '@/components/trade/recent-trades';
import { UserTrades } from '@/components/trade/user-trades';

interface Props {
  marketId: string;
}

export default function TradePageClient({ marketId }: Props) {
  const [mode, setMode] = useState<TradeMode>('Advanced');
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const ticker = useMarketDataStore((s) => s.ticker);

  useEffect(() => {
    const symbol = marketId.replace('-', '').toLowerCase();
    const service = MarketDataService.get(symbol);
    service.connect();
    return () => {
      service.disconnect();
    };
  }, [marketId]);

  return (
    <div className="flex flex-col bg-[#05070a] text-gray-200 h-full">

      {showOrderPanel && (
        <FloatingOrderPanel>
          <OrderFormAdvanced marketId={marketId} />
          <div className="mt-4">
            <PnlCalculator price={ticker?.c ? parseFloat(ticker.c) : 0} />
          </div>
        </FloatingOrderPanel>
      )}

      <Hotkeys
        toggleOrderPanel={() => setShowOrderPanel((s) => !s)}
        goToChart={() => setMode("Chart")}
        goToOrderbook={() => setMode("Advanced")}
      />

      <MarketHeader marketId={marketId} />

      <ModeSwitcher activeMode={mode} setMode={setMode} />

      <div className="flex-1 mt-2 min-h-[300px] md:min-h-[400px]">
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
