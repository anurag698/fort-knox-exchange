// src/app/trade/[marketId]/page.tsx
import React from "react";
import ProTradingLayout from "@/components/trade/pro-trading-layout";
import { useParamsSafe } from "@/lib/next-utils";

export default function Page({ params }: { params: any }) {
  const resolved = useParamsSafe(params);
  const pair = (resolved.marketId ?? "BTC-USDT") as string;

  return <ProTradingLayout marketId={pair} />;
}
