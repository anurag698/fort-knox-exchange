'use client';

import { useEffect, useState } from 'react';
import { ModeSwitcher, type TradeMode } from '@/components/trade/mode-switcher';
import { AdvancedLayout } from '@/components/trade/advanced-layout';
import { ChartLayout } from '@/components/trade/chart-layout';
import { DepthLayout } from '@/components/trade/depth-layout';
import { MarketDataService, useMarketDataStore } from '@/lib/market-data-service';
import { MarketHeader } from '@/components/trade/market-header';
import { FloatingOrderPanel } from '@/components/trade/floating-order-panel';
import { OrderForm } from '@/components/trade/order-form';
import { PnlCalculator } from '@/components/trade/pnl-calculator';
import { Hotkeys } from '@/components/trade/hotkeys';

interface Props {
  marketId: string;
}

export default function TradePageClient({ marketId }: Props) {
  const [mode, setMode] = useState<TradeMode>('Advanced');
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const ticker = useMarketDataStore((s) => s.ticker);

  useEffect(() => {
    // The symbol for Binance WS is lowercase without hyphen
    const symbol = marketId.replace('-', '').toLowerCase();
    
    // Get the service instance for the current symbol
    const service = MarketDataService.get(symbol);
    
    // Connect to all necessary streams
    service.connect();

    // Disconnect when the component unmounts or the marketId changes
    return () => {
      service.disconnect();
    };
  }, [marketId]);

  return (
    <div className="flex flex-col bg-[#05070a] text-gray-200 h-full">

      {showOrderPanel && (
        <FloatingOrderPanel>
          <OrderForm marketId={marketId} />
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

      <div className="flex-grow mt-2">
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
    </div>
  );
}
