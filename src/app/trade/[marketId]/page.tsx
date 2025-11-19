
"use client";

import ProTradingLayout from "@/components/trade/trading-layout";

// This is now an async component to correctly handle the params promise.
export default function Page({ params }: { params: { marketId: string } }) {
  const pair = params.marketId ?? "BTC-USDT";

  // The main layout for the professional trading view
  return <ProTradingLayout marketId={pair} />;
}
