
'use client';

import React from 'react';
import Portal from '@/components/ui/portal';
import { OrderFormAdvanced } from './order-form-advanced';
import { PnlCalculator } from './pnl-calculator';
import { useMarketDataStore } from '@/state/market-data-store';

function OrderPanelInner({ marketId }: { marketId: string }) {
  const symbol = marketId?.replace('-', '').toUpperCase() || 'BTCUSDT';
  const ticker = useMarketDataStore((s) => s.ticker[symbol]);

  return (
    <div className="absolute left-6 top-6 w-[360px] z-50 pointer-events-auto">
      <div className="w-[360px] bg-[#07121a]/95 border border-[#1f2937] rounded-xl shadow-xl p-4 text-sm">
        <OrderFormAdvanced marketId={marketId} />
        <div className="mt-4">
          <PnlCalculator price={ticker?.lastPrice || ticker?.price || 0} />
        </div>
      </div>
    </div>
  );
}

export default function FloatingOrderPanel(props: { marketId: string }) {
  return (
    <Portal>
      <OrderPanelInner {...props} />
    </Portal>
  );
}
