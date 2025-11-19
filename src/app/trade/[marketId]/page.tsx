// src/app/trade/[marketId]/page.tsx
import React from "react";
import ProTradingLayout from "@/components/trade/trading-layout";

export default function Page({ params }: { params: any }) {
  // Next 15: unwrap params with React.use()
  const resolvedParams = React.use(params) as { marketId?: string } | undefined;
  const pair = (resolvedParams?.marketId ?? "BTC-USDT") as string;

  return <ProTradingLayout marketId={pair} />;
}
