"use client";

import ProTradingLayout from "@/components/trade/trading-layout";

export default function Page({ params }: { params: { marketId: string } }) {
  const pair = params.marketId ?? "BTC-USDT";

  // The main layout for the professional trading view
  return <ProTradingLayout marketId={pair} />;
}
