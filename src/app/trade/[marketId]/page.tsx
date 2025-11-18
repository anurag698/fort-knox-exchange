// This file is the entry point for the trade page.
// It is a server component that renders the client-side trade page.
import TradePageClient from "./trade-page-client";
import { MarketListSidebar } from "@/components/markets/market-list-sidebar";

export default function Page({ params }: { params: { marketId: string } }) {
  return (
    <div className="flex -mx-8 -my-8 h-[calc(100vh-4rem)]">
      <MarketListSidebar />

      <div className="flex-1 p-4">
        <TradePageClient marketId={params.marketId} />
      </div>
    </div>
  );
}
