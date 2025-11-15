import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { Market, Asset } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketsTable } from '@/components/markets/markets-table';
import { CandlestickChart } from 'lucide-react';

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  price: number; // Add price to the type
};

async function getMarketsData(): Promise<EnrichedMarket[]> {
    const { firestore } = getFirebaseAdmin();
    try {
        const marketsSnapshot = await firestore.collection('markets').get();
        const assetsSnapshot = await firestore.collection('assets').get();

        const markets = marketsSnapshot.docs.map(doc => {
            return {
                ...doc.data() as Omit<Market, 'id'>,
                id: doc.id,
                // Add mock data for change and volume
                change: (doc.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1,
                volume: (doc.id.charCodeAt(1) % 100) * 100000 + Math.random() * 50000,
                price: 0, // Initialize price
            };
        });

        const assets = assetsSnapshot.docs.map(doc => ({
            ...doc.data() as Omit<Asset, 'id'>,
            id: doc.id
        }));
        
        const assetsMap = new Map(assets.map(asset => [asset.id, asset]));

        const enrichedMarkets = markets.map(market => ({
            ...market,
            baseAsset: assetsMap.get(market.baseAssetId),
            quoteAsset: assetsMap.get(market.quoteAssetId),
        })).filter(m => m.baseAsset && m.quoteAsset);

        return enrichedMarkets as EnrichedMarket[];
    } catch (error) {
        console.error("Failed to fetch markets on server:", error);
        return [];
    }
}


export default async function MarketsPage() {
  const initialMarkets = await getMarketsData();
    
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
       <Card>
        <CardHeader>
          <CardTitle>Trading Pairs</CardTitle>
          <CardDescription>
            All available markets for trading on the exchange.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {initialMarkets.length > 0 ? (
                <MarketsTable initialMarkets={initialMarkets} />
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <CandlestickChart className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No Markets Found</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        There are currently no markets available. Please try seeding the database.
                    </p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
