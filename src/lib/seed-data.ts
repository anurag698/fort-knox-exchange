

import type { Firestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Seeds the Firestore database with initial public data like assets and markets.
 * This function is idempotent and will not overwrite existing data.
 * @param firestore The Firestore admin instance.
 * @param FieldValue The Firestore FieldValue class.
 */
export async function seedInitialData(firestore: Firestore, FieldValue: any) {
  try {
    const assetsCol = firestore.collection('assets');
    const marketsCol = firestore.collection('markets');
    
    const assetsToSeed = [
        { id: 'USDT', name: 'Tether', symbol: 'USDT' },
        { id: 'BTC', name: 'Bitcoin', symbol: 'BTC' },
        { id: 'ETH', name: 'Ethereum', symbol: 'ETH' },
        { id: 'SOL', name: 'Solana', symbol: 'SOL' },
        { id: 'ADA', name: 'Cardano', symbol: 'ADA' },
        { id: 'MATIC', name: 'Polygon', symbol: 'MATIC' },
        { id: 'DOGE', name: 'Dogecoin', symbol: 'DOGE' },
        { id: 'XRP', name: 'Ripple', symbol: 'XRP' },
        { id: 'DOT', name: 'Polkadot', symbol: 'DOT' },
        { id: 'LINK', name: 'Chainlink', symbol: 'LINK' },
        { id: 'SHIB', name: 'Shiba Inu', symbol: 'SHIB' },
        { id: 'AVAX', name: 'Avalanche', symbol: 'AVAX' },
    ];

    for (const asset of assetsToSeed) {
        const doc = await assetsCol.doc(asset.id).get();
        if (!doc.exists) {
            console.log(`Seeding ${asset.symbol} asset...`);
            await assetsCol.doc(asset.id).set({
                ...asset,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
    }

    const marketsToSeed = [
      // USDT Pairs
      { id: 'BTC-USDT', base: 'BTC', quote: 'USDT', pricePrecision: 2, quantityPrecision: 6, minOrder: 0.00001 },
      { id: 'ETH-USDT', base: 'ETH', quote: 'USDT', pricePrecision: 2, quantityPrecision: 4, minOrder: 0.0001 },
      { id: 'SOL-USDT', base: 'SOL', quote: 'USDT', pricePrecision: 2, quantityPrecision: 2, minOrder: 0.01 },
      { id: 'ADA-USDT', base: 'ADA', quote: 'USDT', pricePrecision: 4, quantityPrecision: 0, minOrder: 1 },
      { id: 'MATIC-USDT', base: 'MATIC', quote: 'USDT', pricePrecision: 4, quantityPrecision: 2, minOrder: 1 },
      { id: 'DOGE-USDT', base: 'DOGE', quote: 'USDT', pricePrecision: 6, quantityPrecision: 0, minOrder: 10 },
      { id: 'XRP-USDT', base: 'XRP', quote: 'USDT', pricePrecision: 4, quantityPrecision: 1, minOrder: 1 },
      { id: 'DOT-USDT', base: 'DOT', quote: 'USDT', pricePrecision: 3, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'LINK-USDT', base: 'LINK', quote: 'USDT', pricePrecision: 3, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'SHIB-USDT', base: 'SHIB', quote: 'USDT', pricePrecision: 8, quantityPrecision: 0, minOrder: 100000 },
      { id: 'AVAX-USDT', base: 'AVAX', quote: 'USDT', pricePrecision: 2, quantityPrecision: 2, minOrder: 0.1 },
      // BTC Pairs
      { id: 'ETH-BTC', base: 'ETH', quote: 'BTC', pricePrecision: 6, quantityPrecision: 4, minOrder: 0.001 },
      { id: 'SOL-BTC', base: 'SOL', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'ADA-BTC', base: 'ADA', quote: 'BTC', pricePrecision: 8, quantityPrecision: 0, minOrder: 10 },
      { id: 'MATIC-BTC', base: 'MATIC', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 10 },
      { id: 'DOGE-BTC', base: 'DOGE', quote: 'BTC', pricePrecision: 8, quantityPrecision: 0, minOrder: 100 },
      { id: 'XRP-BTC', base: 'XRP', quote: 'BTC', pricePrecision: 8, quantityPrecision: 1, minOrder: 10 },
      { id: 'DOT-BTC', base: 'DOT', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 1 },
      { id: 'LINK-BTC', base: 'LINK', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 1 },
      { id: 'AVAX-BTC', base: 'AVAX', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 0.1 },
      // ETH Pairs
      { id: 'SOL-ETH', base: 'SOL', quote: 'ETH', pricePrecision: 6, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'ADA-ETH', base: 'ADA', quote: 'ETH', pricePrecision: 8, quantityPrecision: 0, minOrder: 10 },
      { id: 'MATIC-ETH', base: 'MATIC', quote: 'ETH', pricePrecision: 8, quantityPrecision: 2, minOrder: 10 },
      { id: 'DOGE-ETH', base: 'DOGE', quote: 'ETH', pricePrecision: 8, quantityPrecision: 0, minOrder: 100 },
      { id: 'XRP-ETH', base: 'XRP', quote: 'ETH', pricePrecision: 8, quantityPrecision: 1, minOrder: 10 },
      { id: 'DOT-ETH', base: 'DOT', quote: 'ETH', pricePrecision: 8, quantityPrecision: 2, minOrder: 1 },
      { id: 'LINK-ETH', base: 'LINK', quote: 'ETH', pricePrecision: 8, quantityPrecision: 2, minOrder: 1 },
      { id: 'AVAX-ETH', base: 'AVAX', quote: 'ETH', pricePrecision: 8, quantityPrecision: 2, minOrder: 0.1 },
    ];

    for (const market of marketsToSeed) {
        const doc = await marketsCol.doc(market.id).get();
        if (!doc.exists) {
            console.log(`Seeding ${market.id} market...`);
            await marketsCol.doc(market.id).set({
                id: market.id,
                baseAssetId: market.base,
                quoteAssetId: market.quote,
                pricePrecision: market.pricePrecision,
                quantityPrecision: market.quantityPrecision,
                minOrderSize: market.minOrder,
                makerFee: 0.001,
                takerFee: 0.001,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
    }

  } catch (error) {
    console.error("Error during data seeding:", error);
    // Don't re-throw, as this shouldn't block application startup
  }
}
