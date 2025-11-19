
"use client";

import React, { useState, useRef, useEffect } from "react";
import ThemeToggle from "@/components/theme/theme-toggle";
import OrderForm from "./orderform/order-form";
import { useUser } from "@/firebase";
import Link from "next/link";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";
import ChartToolbar from "./chart/chart-toolbar";
import PositionsPanel from "./positions/positions-panel";
import ChartShell from "./chart/chart-shell";
import { MarketHeader } from "./market-header";
import OrderBook from "./order-book";
import { RecentTrades } from "./recent-trades";
import { Balances } from "./balances";
import { OpenOrdersPanel } from "./open-orders-panel";
import { startMarketDataSubscriber } from "@/services/market-data-subscriber";
import marketDataService from "@/services/market-data-service";
import { cn } from "@/lib/utils";

export default function ProTradingLayout({ marketId }: { marketId: string }) {
  const { user, isUserLoading } = useUser();
  const [interval, setInterval] = useState("1m");
  const [chartType, setChartType] = useState<"candles" | "line" | "area">("candles");
  const chartRef = useRef<any>(null);
  
  useEffect(() => {
    startMarketDataSubscriber();
    if (marketId) {
      const symbol = marketId.replace("-", "").toUpperCase();
      marketDataService.startFeed(symbol, "1m");
    }
    return () => {
      marketDataService.stopFeed();
    };
  }, [marketId]);

  const handleAddEntry = (price: number, size: number) => {
    chartRef.current?.addEntry(price, size);
  };

  const handleRemoveEntry = (id: string) => {
    chartRef.current?.removeEntry(id);
  };
  
  const handleSetTP = (price: number) => {
     chartRef.current?.setTP(price);
  }

  const handleSetSL = (price: number) => {
      chartRef.current?.setSL(price);
  }

  const handleAddTP = (price: number, size: number) => {
    chartRef.current?.addTP(price, size);
  };

  const handleRemoveTP = (id: string) => {
    chartRef.current?.removeTP(id);
  };

  const handleSetLiquidationPrice = (price: number, side: "long" | "short") => {
    chartRef.current?.setLiquidationPrice(price, side);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden -m-8">

      {/* ---------------- TOP NAV + PAIR INFO ---------------- */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-sora text-lg font-semibold tracking-wide text-primary">
              Fort Knox
            </span>
          </Link>
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
       <div className="grid flex-1 grid-cols-12 grid-rows-12 gap-2 p-2 overflow-hidden">
        
        <div className="col-span-12 row-span-2">
            <MarketHeader marketId={marketId} />
        </div>

        <div className="col-span-12 xl:col-span-2 row-span-10 xl:row-span-10">
          <OrderBook />
        </div>

        <div className="col-span-12 xl:col-span-7 row-span-6 xl:row-span-7 relative h-full">
            <ChartShell initialSymbol={marketId} />
        </div>

        <div className="col-span-12 xl:col-span-3 row-span-10 xl:row-span-10 flex flex-col gap-2">
            <RecentTrades marketId={marketId} />
        </div>

        <div className="col-span-12 xl:col-span-4 row-span-3 xl:row-span-3">
          <OrderForm marketId={marketId} />
        </div>

        <div className="col-span-12 xl:col-span-3 row-span-3 xl:row-span-3 flex flex-col gap-2">
           <Balances marketId={marketId} />
           <OpenOrdersPanel marketId={marketId} />
        </div>
      </div>
    </div>
  );
}
