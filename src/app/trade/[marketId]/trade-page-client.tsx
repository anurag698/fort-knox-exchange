// src/app/trade/[marketId]/trade-page-client.tsx
"use client";

import React, { useEffect, useState } from "react";
import TradingChartContainer from "@/components/trade/trading-chart-container";
import OrderbookPanel from "@/components/trade/orderbook/orderbook-panel";
import OrderForm from "@/components/trade/orderform/order-form";
import marketDataService from "@/services/market-data-service";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TradePageClient({ params }: { params: { marketId: string } }) {
  const marketId = params?.marketId ?? "BTC-USDT";
  const symbol = marketId.replace("-", "").toUpperCase();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    marketDataService.startFeed(symbol, "1m");
    return () => {
      // leave feed running globally or stop here if desired
      // marketDataService.stopFeed();
    };
  }, [symbol]);

  return (
    <div className="flex gap-3 p-4 h-full">
      {/* Main Chart Area */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? "mr-0" : ""}`}>
        <TradingChartContainer marketId={marketId} />
      </div>

      {/* Sidebar with Orderbook and Order Form */}
      <aside
        className={`relative flex flex-col gap-3 transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-[360px] opacity-100"
          }`}
      >
        {!sidebarCollapsed && (
          <>
            <OrderbookPanel />
            <OrderForm marketId={marketId} />
          </>
        )}
      </aside>

      {/* Collapse/Expand Button */}
      <Button
        size="sm"
        variant="ghost"
        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-6 p-0 rounded-l-md border border-r-0 border-border bg-card hover:bg-accent transition-all duration-200 z-20"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {sidebarCollapsed ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
