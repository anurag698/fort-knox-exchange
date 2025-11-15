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

// NOTE: We are keeping the 'use client' directive at the top of this file.
// The default export will now be the client component.
// Any server-side logic for this route should be moved to a parent Server Component
// or handled via API routes. Since this page is purely interactive, making it
// fully client-side is the most direct way to resolve the rendering errors.
export default function MarketTradePage({ params }: { params: { marketId: string } }) {
  const { marketId } = params;
  return <TradePageClient marketId={marketId} />;
}
