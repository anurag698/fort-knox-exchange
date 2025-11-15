import TradePageClient from './trade-page-client';

// This is a pure Server Component. Its only job is to get the `marketId`
// from the route parameters and pass it to the Client Component.
export default function TradePage({ params }: { params: { marketId: string } }) {
  // Direct access is safe here because this is a Server Component.
  const { marketId } = params;

  // Render the Client Component and pass the marketId as a prop.
  return <TradePageClient marketId={marketId} />;
}
