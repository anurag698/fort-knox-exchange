"use client";

import { MarketListSidebar } from "./markets/market-list-sidebar";
import LightweightProChart from "./lightweight-pro-chart";
import OrderBook from "./orderbook/orderbook";
import TradeTape from "./trades/trade-tape";
import { OrderFormAdvanced } from "./order-form-advanced";
import { PositionsPanel } from "./positions-panel";
import { OpenOrdersPanel } from "./open-orders-panel";

export default function TradingLayout({ marketId }: { marketId: string }) {
  return (
    <div className="w-full h-[calc(100vh-8rem)] flex bg-[#0D0D12] text-white overflow-hidden -m-8">
      {/* LEFT: Markets List Sidebar */}
      <div className="w-[280px] border-r border-neutral-800 bg-[#0d0f12] flex-shrink-0">
        <MarketListSidebar />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* Top: Chart */}
        <div className="flex-1 border-b border-neutral-800 relative">
          <LightweightProChart pair={marketId} height={600}/>
        </div>
        
        {/* Bottom Panels */}
        <div className="h-[300px] flex flex-col">
            <div className="flex-grow overflow-hidden">
                 <PositionsPanel />
            </div>
        </div>
      </div>

      {/* RIGHT: Orderbook, Trades, Order Form */}
      <div className="w-[320px] border-l border-neutral-800 flex flex-col flex-shrink-0">
        {/* Order Book */}
        <div className="h-[45%] border-b border-neutral-800">
            <OrderBook />
        </div>
        
        {/* Order Form */}
        <div className="h-[55%]">
            <OrderFormAdvanced marketId={marketId} />
        </div>

      </div>
    </div>
  );
}
