// src/app/trade/[marketId]/page.tsx
import React from "react";
import ProTradingLayout from "@/components/trade/pro-trading-layout";

export default async function Page({
  params
}: {
  params: Promise<{ marketId: string }>
}) {
  const { marketId } = await params;
  const pair = marketId ?? "BTC-USDT";

  return <ProTradingLayout marketId={pair} />;
}
