"use client";

import React, { useEffect } from "react";
import ThemeToggle from "@/components/theme/theme-toggle";
import { useUser } from '@/providers/azure-auth-provider';
import Link from "next/link";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";
import { MarketHeader } from "./market-header";
import OrderBook from "./order-book";
import { RecentTrades } from "./recent-trades";
import { Balances } from "./balances";
import { UserTrades } from "./user-trades";
import { cn } from "@/lib/utils";
import TradingChartContainer from "./trading-chart-container";
import { OrderForm } from "./order-form";
import { OrderTabs } from "./order-tabs";
import useMarketDataStore from '@/state/market-data-store';
import { MarketDataSubscriber } from "./market-data-subscriber";
import { PairSwitcher } from "./pair-switcher";

interface ProTradingLayoutProps {
  marketId: string;
}

export default function ProTradingLayout({ marketId }: ProTradingLayoutProps) {
  const { user, isUserLoading } = useUser();
  const [mobileTab, setMobileTab] = React.useState<'chart' | 'trade' | 'book' | 'orders'>('chart');

  // Convert marketId (e.g., "BTC-USDT") to MEXC symbol format (e.g., "BTCUSDT")
  const symbol = marketId.replace('-', '').toUpperCase();

  // Update store symbol for components to reference
  useEffect(() => {
    (useMarketDataStore.getState() as any).symbol = symbol;
  }, [symbol]);

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground font-sans lg:pt-16">
      <MarketDataSubscriber marketId={marketId} />

      {/* ---------------- TOP NAV (Common) ---------------- */}
      <header className="h-auto px-0 flex flex-col border-b border-primary/20 bg-gradient-to-r from-card to-card/80 flex-shrink-0 z-50 sticky top-0 lg:static shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden w-full">
          <MarketHeader marketId={marketId} />
        </div>
        <PairSwitcher />
      </header>

      {/* ---------------- DESKTOP LAYOUT (Hidden on Mobile) ---------------- */}
      <div className="hidden lg:flex flex-1 flex-row bg-background w-full overflow-hidden">

        {/* LEFT + CENTER: CHART + BOTTOM TABS */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Chart Area - Optimized Height */}
          <div className="h-[500px] lg:h-[calc(60vh)] border-b border-primary/10 relative bg-card">
            <TradingChartContainer marketId={marketId} />
          </div>

          {/* Bottom Tabs - Optimized Height */}
          <div className="h-[400px] lg:h-[calc(40vh)] bg-card flex flex-col border-t border-primary/10">
            <OrderTabs marketId={marketId} />
          </div>

        </div>

        {/* RIGHT SIDEBAR: ORDER BOOK + RECENT TRADES + ORDER FORM - Enhanced Width */}
        <div className="flex w-[360px] flex-shrink-0 border-l border-primary/10 flex-col bg-card overflow-hidden shadow-lg">

          {/* Order Book - 35% */}
          <div className="h-[35%] border-b border-primary/10 min-h-0 overflow-y-auto">
            <OrderBook marketId={marketId} />
          </div>

          {/* Recent Trades - 20% */}
          <div className="h-[20%] border-b border-primary/10 min-h-0 overflow-y-auto">
            <RecentTrades marketId={marketId} />
          </div>

          {/* Order Form - 45% */}
          <div className="h-[45%] min-h-0 overflow-y-auto">
            <OrderForm marketId={marketId} />
          </div>

        </div>

      </div>

      {/* ---------------- MOBILE LAYOUT (Visible only on Mobile) ---------------- */}
      <div className="flex lg:hidden flex-1 flex-col bg-background w-full overflow-hidden relative">

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-16">
          {mobileTab === 'chart' && (
            <div className="h-[60vh] min-h-[400px]">
              <TradingChartContainer marketId={marketId} />
              <div className="h-[300px] border-t border-primary/10">
                <RecentTrades marketId={marketId} />
              </div>
            </div>
          )}

          {mobileTab === 'trade' && (
            <div className="h-full">
              <OrderForm marketId={marketId} />
            </div>
          )}

          {mobileTab === 'book' && (
            <div className="h-full">
              <OrderBook marketId={marketId} />
            </div>
          )}

          {mobileTab === 'orders' && (
            <div className="h-full">
              <OrderTabs marketId={marketId} />
            </div>
          )}
        </div>

        {/* Bottom Tab Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-card border-t border-primary/20 flex items-center justify-around px-2 z-50 pb-safe">
          <Button
            variant="ghost"
            onClick={() => setMobileTab('chart')}
            className={cn("flex flex-col items-center gap-1 h-full flex-1 rounded-none", mobileTab === 'chart' && "text-primary bg-primary/5")}
          >
            <span className="text-xs font-medium">Chart</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMobileTab('trade')}
            className={cn("flex flex-col items-center gap-1 h-full flex-1 rounded-none", mobileTab === 'trade' && "text-primary bg-primary/5")}
          >
            <span className="text-xs font-medium">Trade</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMobileTab('book')}
            className={cn("flex flex-col items-center gap-1 h-full flex-1 rounded-none", mobileTab === 'book' && "text-primary bg-primary/5")}
          >
            <span className="text-xs font-medium">Book</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMobileTab('orders')}
            className={cn("flex flex-col items-center gap-1 h-full flex-1 rounded-none", mobileTab === 'orders' && "text-primary bg-primary/5")}
          >
            <span className="text-xs font-medium">Orders</span>
          </Button>
        </div>

      </div>
    </div>
  );
}
