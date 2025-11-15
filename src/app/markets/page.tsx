import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { Market, Asset } from '@/lib/types';
import { MarketsClientPage } from '@/components/markets/markets-client-page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

async function getMarkets(): Promise<{ markets: Market[], assets: Asset[] }> {
    const { firestore } = getFirebaseAdmin();
    try {
        const marketsSnapshot = await firestore.collection('markets').get();
        const assetsSnapshot = await firestore.collection('assets').get();

        const markets = marketsSnapshot.docs.map(doc => {
            const data = doc.data();
            // Mock change and volume as these are not in the DB
            const change = (doc.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1;
            const volume = (doc.id.charCodeAt(1) % 100) * 100000 + Math.random() * 50000;
            return {
                id: doc.id,
                baseAssetId: data.baseAssetId,
                quoteAssetId: data.quoteAssetId,
                minOrderSize: data.minOrderSize,
                pricePrecision: data.pricePrecision,
                quantityPrecision: data.quantityPrecision,
                makerFee: data.makerFee,
                takerFee: data.takerFee,
                createdAt: data.createdAt.toDate().toISOString(),
                change,
                volume,
            } as Market;
        });

        const assets = assetsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                symbol: data.symbol,
                name: data.name,
                createdAt: data.createdAt.toDate().toISOString(),
            } as Asset;
        });

        return { markets, assets };
    } catch (error) {
        console.error("Failed to fetch markets or assets from server:", error);
        return { markets: [], assets: [] };
    }
}


export default async function MarketsPage() {
  const { markets, assets } = await getMarkets();

  const enrichedMarkets = markets.map(market => {
      const baseAsset = assets.find(a => a.id === market.baseAssetId);
      const quoteAsset = assets.find(a => a.id === market.quoteAssetId);
      return {
        ...market,
        price: 0, // Initial price, will be updated by client
        baseAsset,
        quoteAsset,
      };
  }).filter(m => m.baseAsset && m.quoteAsset); // Ensure both assets were found

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
            <MarketsClientPage initialMarkets={enrichedMarkets} />
        </CardContent>
      </Card>
    </div>
  );
}
