"use client";

import { MarketListSidebar } from "./markets/market-list-sidebar";
import LightweightProChart from "./lightweight-pro-chart";
import OrderBook from "./order-book";
import { RecentTrades } from "./recent-trades";
import { OrderFormAdvanced } from "./order-form-advanced";
import { PositionsPanel } from "./positions-panel";
import { OpenOrdersPanel } from "./open-orders-panel";

export default function TradingLayout({ marketId }: { marketId: string }) {
  return (
    <div className="w-full h-[calc(100vh-8rem)] flex bg-[#0D1522] text-white overflow-hidden -m-8">
      {/* LEFT: Markets List Sidebar */}
      <div className="w-[280px] border-r border-[#131D2E] bg-[#070B12] flex-shrink-0">
        <MarketListSidebar />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* Top: Chart */}
        <div className="flex-1 border-b border-[#131D2E] relative">
          <LightweightProChart pair={marketId} />
        </div>
        
        {/* Bottom Panels */}
        <div className="h-[250px] flex">
          <div className="w-[60%] border-r border-[#131D2E] h-full">
             <OrderBook />
          </div>
          <div className="w-[40%] h-full">
            <RecentTrades marketId={marketId} />
          </div>
        </div>
      </div>

      {/* RIGHT: Order Form, Positions, Open Orders */}
      <div className="w-[320px] border-l border-[#131D2E] flex flex-col flex-shrink-0 bg-[#070B12]">
        {/* Order Form */}
        <div className="h-[55%] border-b border-[#131D2E]">
          <OrderFormAdvanced marketId={marketId} />
        </div>
        
        {/* Positions & Open Orders */}
        <div className="h-[45%]">
            <PositionsPanel />
        </div>
      </div>
    </div>
  );
}
