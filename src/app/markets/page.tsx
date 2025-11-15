
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import type { Market, Asset } from '@/lib/types';
import { collection, getDocs, query } from 'firebase/firestore';
import { MarketsClientPage } from "@/components/markets/markets-client-page";

// This is now a Server Component, so we can fetch data directly.
export default async function MarketsPage() {
  let initialMarkets: (Market & { baseAsset?: Asset, quoteAsset?: Asset })[] = [];
  let error: string | null = null;

  try {
    const { firestore } = getFirebaseAdmin();
    const marketsQuery = query(collection(firestore, 'markets'));
    const assetsQuery = query(collection(firestore, 'assets'));

    const [marketsSnapshot, assetsSnapshot] = await Promise.all([
      getDocs(marketsQuery),
      getDocs(assetsQuery),
    ]);

    const marketsData = marketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Market));
    const assetsData = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
    const assetsMap = new Map(assetsData.map(asset => [asset.id, asset]));

    initialMarkets = marketsData.map(market => {
       // Mock change and volume for display as these are not in the DB
      const change = (market.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1;
      const volume = (market.id.charCodeAt(1) % 100) * 100000 + Math.random() * 50000;
      
      return {
        ...market,
        baseAsset: assetsMap.get(market.baseAssetId),
        quoteAsset: assetsMap.get(market.quoteAssetId),
        change,
        volume,
      }
    });

  } catch (err) {
    console.error("Failed to fetch initial market data on server:", err);
    error = err instanceof Error ? err.message : 'An unknown error occurred.';
  }

  return (
    <div className="flex flex-col gap-8">
       <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Markets
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Explore real-time market data from the Fort Knox Exchange.
        </p>
      </div>
      <MarketsClientPage initialMarkets={initialMarkets} error={error} />
    </div>
  );
}
