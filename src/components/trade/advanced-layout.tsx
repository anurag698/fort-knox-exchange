// src/components/trade/advanced-layout.tsx
"use client";

import React, { useState } from 'react';
import CanvasDepthChart from '@/components/trade/canvas-depth-chart';
import FloatingOrderPanel from '@/components/trade/floating-order-panel';
import OrderBook from './order-book';
import { RecentTrades } from './recent-trades';
import { Balances } from './balances';
import { OpenOrdersPanel } from './open-orders-panel';
import { OrderHistoryPanel } from './order-history-panel';
import { TradeHistoryPanel } from './trade-history-panel';
import { PositionsPanel } from './positions-panel';
import { cn } from '@/lib/utils';
import LightweightChart from './lightweight-chart';

export function AdvancedLayout({ marketId }: { marketId: string }) {
  const [tab, setTab] = React.useState<'open-orders' | 'order-history' | 'trade-history' | 'positions'>('open-orders');
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="grid h-full grid-cols-12 grid-rows-12 gap-2">
      <div className="col-span-12 row-span-6 lg:col-span-9 relative h-[420px] max-h-[420px] overflow-hidden rounded-lg bg-[#081018]">
        <LightweightChart marketId={marketId} />
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3 lg:row-span-12">
        <OrderBook />
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3">
        {/* This div is now a placeholder as the order panel is rendered via Portal */}
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3">
        <RecentTrades marketId={marketId} />
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-3">
        <div className="flex h-full flex-col gap-2">
          <Balances marketId={marketId} />
          <div className="flex-grow">
            {/* Placeholder for future components */}
          </div>
        </div>
      </div>
      <div className="col-span-12 row-span-6 lg:col-span-9">
         <div className={cn("border-t border-zinc-800 bg-zinc-900", "sticky bottom-0 z-20 md:static")}>
            <div className="flex items-center justify-start gap-2 px-4 pt-2">
              <button onClick={() => setTab('open-orders')} className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition', tab === 'open-orders' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40')}>Open Orders</button>
              <button onClick={() => setTab('order-history')} className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition', tab === 'order-history' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40')}>Order History</button>
              <button onClick={() => setTab('trade-history')} className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition', tab === 'trade-history' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40')}>Trade History</button>
              <button onClick={() => setTab('positions')} className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition', tab === 'positions' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40')}>Positions</button>
              <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-zinc-500 hover:text-white text-xs md:hidden">
                {collapsed ? "Expand ▲" : "Collapse ▼"}
              </button>
            </div>
             <div className={cn("px-4 pb-4 pt-2 transition-all duration-300 overflow-hidden", collapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[450px] opacity-100")}>
              {tab === 'open-orders' && <OpenOrdersPanel marketId={marketId} />}
              {tab === 'order-history' && <OrderHistoryPanel />}
              {tab === 'trade-history' && <TradeHistoryPanel />}
              {tab === 'positions' && <PositionsPanel />}
            </div>
        </div>
      </div>
    </div>
  );
}
