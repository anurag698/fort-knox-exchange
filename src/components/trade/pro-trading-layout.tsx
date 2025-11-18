// src/components/trade/pro-trading-layout.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamic import for heavy components
const ProChart = dynamic(
  () => import("./lightweight-pro-chart"),
  { ssr: false }
);

const OrderBook = dynamic(
  () => import("./order-book"),
  { ssr: false }
);

const RecentTrades = dynamic(
  () => import("./recent-trades"),
  { ssr: false }
);

const OrderForm = dynamic(
  () => import("./order-form"),
  { ssr: false }
);

// Layout Wrapper
export default function ProTradingLayout({
  pair,
  wsUrl,
}: {
  pair: string;
  wsUrl: string;
}) {
  return (
    <div className="w-full h-full grid grid-cols-12 gap-4 p-4">

      {/* LEFT SIDE — CHART */}
      <div className="col-span-12 lg:col-span-8 flex flex-col rounded-xl bg-[#0d1117] border border-[#1b2635]">
        <div className="p-3 border-b border-[#1b2635] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{pair}</h2>
        </div>

        {/* Chart */}
        <div className="flex-1">
          <ProChart
            pair={pair}
            interval="1m"
            wsUrl={wsUrl}
            candlesApi={(p, i, f, t) =>
              `/api/marketdata/candles?pair=${p}&interval=${i}&from=${f}&to=${t}`
            }
            height={580}
          />
        </div>
      </div>

      {/* RIGHT SIDE — ORDERBOOK + TRADES + ORDER FORM */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

        {/* Orderbook */}
        <div className="rounded-xl bg-[#0d1117] border border-[#1b2635] p-4">
          <h3 className="text-white text-sm mb-3">Order Book</h3>
          <OrderBook marketId={pair} />
        </div>

        {/* Trades */}
        <div className="rounded-xl bg-[#0d1117] border border-[#1b2635] p-4">
          <h3 className="text-white text-sm mb-3">Recent Trades</h3>
          <RecentTrades marketId={pair} />
        </div>

        {/* Order Form */}
        <div className="rounded-xl bg-[#0d1117] border border-[#1b2635] p-4">
          <h3 className="text-white text-sm mb-3">Trade</h3>
          <OrderForm marketId={pair} />
        </div>
      </div>
    </div>
  );
}
