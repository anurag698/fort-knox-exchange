"use client";

import TradingLayout from "@/components/trade/trading-layout";

export default function Page({ params }: { params: { marketId: string } }) {
  const pair = params.marketId ?? "BTC-USDT";

  return <TradingLayout marketId={pair} />;
}
