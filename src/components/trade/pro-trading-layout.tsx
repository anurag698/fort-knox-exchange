"use client";

import React, { useState, useRef, useEffect } from "react";
import ThemeToggle from "@/components/ui/theme-toggle";
import MarketsSidebar from "./markets/markets-sidebar";
import TradingChart from "@/components/trade/chart/lightweight-pro-chart";
import OrderForm from "./orderform/order-form";
import OrderbookPanel from "./orderbook/orderbook-panel";
import TradesPanel from "./trades/trades-panel";
import { useUser } from "@/firebase";
import Link from "next/link";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";
import ChartToolbar from "./chart/chart-toolbar";
import PositionsPanel from "./positions/positions-panel";
import ChartShell from "./chart/chart-shell";

export default function ProTradingLayout({ marketId }: { marketId: string }) {
  const { user, isUserLoading } = useUser();
  const [interval, setInterval] = useState("1m");
  const [chartType, setChartType] = useState<"candles" | "line" | "area">("candles");

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
          <MarketsSidebar />
        </aside>

        {/* ------------------- CENTER: CHART ------------------- */}
        <section className="flex-1 flex flex-col border-r border-border">
          {/* CHART */}
          <div className="flex-1 min-h-[400px] bg-background p-2">
            <ChartToolbar 
              interval={interval}
              setInterval={setInterval}
              chartType={chartType}
              setChartType={setChartType}
            />
            <ChartShell
              symbol={marketId}
              interval={interval}
              chartType={chartType}
            />
          </div>

          {/* BOTTOM PANELS — ORDERBOOK + TRADES */}
          <div className="h-[320px] grid grid-cols-2 border-t border-border bg-card">
            <div className="col-span-1 border-r border-border">
              <OrderbookPanel />
            </div>
            <div className="col-span-1">
              <TradesPanel />
            </div>
          </div>
        </section>

        {/* ---------------- RIGHT SIDEBAR: ORDER FORM ---------------- */}
        <aside className="w-[310px] min-w-[310px] border-l border-border bg-card p-2 grid grid-rows-2 gap-2">
          <div className="row-span-1">
            <OrderForm pair={marketId} />
          </div>
          <div className="row-span-1">
             <PositionsPanel />
          </div>
        </aside>

      </main>
    </div>
  );
}
