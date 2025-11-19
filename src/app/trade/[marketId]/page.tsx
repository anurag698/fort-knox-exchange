"use client";

import { use } from "react";
import TradePageClient from "./trade-page-client";
import ProTradingLayout from "@/components/trade/pro-trading-layout";

export default function Page({ params }: { params: { marketId: string } }) {
  const resolvedParams = use(params);
  const pair = resolvedParams.marketId ?? "BTC-USDT";

  // Use ProTradingLayout for now, as it's the one we've been fixing.
  // We can switch back to TradePageClient once we confirm this layout is stable.
  return (
      <ProTradingLayout
        pair={pair}
        wsUrl={process.env.NEXT_PUBLIC_KLINE_WS_URL ?? "ws://localhost:8080"}
      />
  );
}
