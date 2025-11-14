
import type { Firestore } from 'firebase-admin/firestore';

/**
 * Seeds the Firestore database with initial public data like assets and markets.
 * This function is idempotent and will not overwrite existing data.
 * @param firestore The Firestore admin instance.
 */
export async function seedInitialData(firestore: Firestore) {
  try {
    const assetsCol = firestore.collection('assets');
    const marketsCol = firestore.collection('markets');
    
    const usdtDoc = await assetsCol.doc('USDT').get();
    if (!usdtDoc.exists) {
      console.log("Seeding USDT asset...");
      await assetsCol.doc('USDT').set({
        id: 'USDT',
        name: 'Tether',
        symbol: 'USDT',
        createdAt: new Date(),
      });
    }

    const btcDoc = await assetsCol.doc('BTC').get();
    if (!btcDoc.exists) {
        console.log("Seeding BTC asset...");
      await assetsCol.doc('BTC').set({
        id: 'BTC',
        name: 'Bitcoin',
        symbol: 'BTC',
        createdAt: new Date(),
      });
    }

    const ethDoc = await assetsCol.doc('ETH').get();
    if (!ethDoc.exists) {
        console.log("Seeding ETH asset...");
      await assetsCol.doc('ETH').set({
        id: 'ETH',
        name: 'Ethereum',
        symbol: 'ETH',
        createdAt: new Date(),
      });
    }

    const btcUsdtMarket = await marketsCol.doc('BTC-USDT').get();
    if (!btcUsdtMarket.exists) {
        console.log("Seeding BTC-USDT market...");
      await marketsCol.doc('BTC-USDT').set({
        id: 'BTC-USDT',
        baseAssetId: 'BTC',
        quoteAssetId: 'USDT',
        minOrderSize: 0.00001,
        pricePrecision: 2,
        quantityPrecision: 6,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }
    
    const ethUsdtMarket = await marketsCol.doc('ETH-USDT').get();
    if (!ethUsdtMarket.exists) {
        console.log("Seeding ETH-USDT market...");
      await marketsCol.doc('ETH-USDT').set({
        id: 'ETH-USDT',
        baseAssetId: 'ETH',
        quoteAssetId: 'USDT',
        minOrderSize: 0.0001,
        pricePrecision: 2,
        quantityPrecision: 4,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

  } catch (error) {
    console.error("Error during data seeding:", error);
    // Don't re-throw, as this shouldn't block application startup
  }
}
