'use client';

import { useState } from "react";
import { Balances } from "@/components/trade/balances";
import { MemoizedTradingViewChart } from "@/components/trade/trading-view-chart";
import { OrderBook } from "@/components/trade/order-book";
import { OrderForm } from "@/components/trade/order-form";
import { UserTrades } from "@/components/trade/user-trades";

// This is the Client Component that contains all the interactive UI.
function TradePageClient({ marketId }: { marketId: string }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-9 flex flex-col gap-4">
        <MemoizedTradingViewChart marketId={marketId} />
        <UserTrades marketId={marketId} />
      </div>
      <div className="lg:col-span-3 flex flex-col gap-4">
        <OrderBook marketId={marketId} onPriceSelect={setSelectedPrice} />
        <Balances marketId={marketId} />
        <OrderForm marketId={marketId} selectedPrice={selectedPrice} />
      </div>
    </div>
  );
}

// The default export is a Server Component that handles params.
export default function TradePage({ params }: { params: { marketId: string } }) {
  // Although not using React.use() is allowed for now, it's best practice to destructure directly.
  const { marketId } = params;
  return <TradePageClient marketId={marketId} />;
}
