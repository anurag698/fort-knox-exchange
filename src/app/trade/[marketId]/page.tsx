// src/app/trade/[marketId]/page.tsx
import React from "react";
import ProTradingLayout from "@/components/trade/pro-trading-layout";

export default function Page({ params }: { params: { marketId: string } }) {
  // Next.js 15: params may be a Promise — but in app router page it's okay
  const pair = (params?.marketId ?? "BTC-USDT") as string;

  return <ProTradingLayout marketId={pair} />;
}
