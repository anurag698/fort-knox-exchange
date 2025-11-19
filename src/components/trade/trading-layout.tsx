"use client";

import React from "react";
import ThemeToggle from "@/components/theme/theme-toggle";

// Panels (placeholders for now, will be built in later parts)
import MarketListSidebar from "@/components/trade/markets/market-list-sidebar";
import TradingChart from "@/components/trade/chart/trading-chart-container";
import OrderForm from "@/components/trade/orders/order-form";
import OrderbookPanel from "@/components/trade/orderbook/orderbook-panel";
import TradesPanel from "@/components/trade/trades/trades-panel";
import { useUser } from "@/firebase";
import Link from "next/link";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";

export default function ProTradingLayout({ marketId }: { marketId: string }) {
  const { user, isUserLoading } = useUser();
  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden -m-8">

      {/* ---------------- TOP NAV + PAIR INFO ---------------- */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-sora text-lg font-semibold tracking-wide text-primary">
              Fort Knox Exchange
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-secondary">
            <span>24h High: --</span>
            <span>24h Low: --</span>
            <span>24h Volume: --</span>
            <span className="text-primary font-semibold">
              {marketId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {!isUserLoading && !user && (
            <Button asChild variant="outline" size="sm">
              <Link href="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* ---------------- CORE TRADING GRID ---------------- */}
      <main className="flex flex-1 overflow-hidden">

        {/* ----------- LEFT SIDEBAR: MARKETS LIST ----------- */}
        <aside className="w-[260px] min-w-[260px] max-w-[260px] border-r border-border bg-card">
          <MarketListSidebar />
        </aside>

        {/* ------------------- CENTER: CHART ------------------- */}
        <section className="flex-1 flex flex-col border-r border-border">
          {/* CHART */}
          <div className="flex-1 min-h-[400px] bg-background">
            <TradingChart pair={marketId} />
          </div>

          {/* BOTTOM PANELS — ORDERBOOK + TRADES */}
          <div className="h-[280px] flex border-t border-border bg-card">
            <div className="w-1/2 border-r border-border">
              <OrderbookPanel pair={marketId} />
            </div>
            <div className="w-1/2">
              <TradesPanel />
            </div>
          </div>
        </section>

        {/* ---------------- RIGHT SIDEBAR: ORDER FORM ---------------- */}
        <aside className="w-[310px] min-w-[310px] border-l border-border bg-card">
          <OrderForm pair={marketId} />
        </aside>

      </main>
    </div>
  );
}
