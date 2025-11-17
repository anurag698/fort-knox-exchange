
import TradePageClient from "./trade-page-client";

export default function Page({ params }: { params: { marketId: string } }) {
  return <TradePageClient marketId={params.marketId} />;
}
