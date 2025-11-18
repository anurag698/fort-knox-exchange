// src/app/trade/[marketId]/page.tsx
'use client';
import ProTradingLayout from "@/components/trade/pro-trading-layout";

export default function Page({ params }: any) {
  const pair = params.marketId ?? "BTC-USDT";

  return (
    <ProTradingLayout
      pair={pair}
      wsUrl={process.env.NEXT_PUBLIC_KLINE_WS_URL ?? "ws://localhost:8080"}
    />
  );
}
