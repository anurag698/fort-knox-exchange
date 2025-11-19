"use client";

import TradingLayout from "@/components/trade/trading-layout";

export default function Page({ params }: { params: { marketId: string } }) {
  const pair = params.marketId ?? "BTC-USDT";

  // The main layout for the professional trading view
  return <TradingLayout marketId={pair} />;
}
