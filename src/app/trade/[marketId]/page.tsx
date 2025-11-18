// This file is the entry point for the trade page.
// It is a server component that renders the client-side trade page.
import TradePageClient from "./trade-page-client";

export default function Page({ params }: { params: { marketId: string } }) {
  return <TradePageClient marketId={params.marketId} />;
}
