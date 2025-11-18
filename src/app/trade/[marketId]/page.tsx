"use client";

import { use } from "react";
import ProTradingLayout from "@/components/trade/pro-trading-layout";

export default function Page({ params }: any) {
  const resolved = use(params);
  const pair = resolved.marketId ?? "BTC-USDT";

  return (
    <ProTradingLayout
      pair={pair}
      wsUrl={""}
    />
  );
}
