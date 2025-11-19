"use client";

import TradePageClient from "./trade-page-client";

export default function Page({ params }: { params: { marketId: string } }) {
  const pair = params.marketId ?? "BTC-USDT";

  return (
      <TradePageClient marketId={pair} />
  );
}
