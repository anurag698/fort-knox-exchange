

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
    
    const solDoc = await assetsCol.doc('SOL').get();
    if (!solDoc.exists) {
        console.log("Seeding SOL asset...");
      await assetsCol.doc('SOL').set({
        id: 'SOL',
        name: 'Solana',
        symbol: 'SOL',
        createdAt: new Date(),
      });
    }
    
    const adaDoc = await assetsCol.doc('ADA').get();
    if (!adaDoc.exists) {
        console.log("Seeding ADA asset...");
      await assetsCol.doc('ADA').set({
        id: 'ADA',
        name: 'Cardano',
        symbol: 'ADA',
        createdAt: new Date(),
      });
    }

    const maticDoc = await assetsCol.doc('MATIC').get();
    if (!maticDoc.exists) {
        console.log("Seeding MATIC asset...");
      await assetsCol.doc('MATIC').set({
        id: 'MATIC',
        name: 'Polygon',
        symbol: 'MATIC',
        createdAt: new Date(),
      });
    }

    const dogeDoc = await assetsCol.doc('DOGE').get();
    if (!dogeDoc.exists) {
        console.log("Seeding DOGE asset...");
      await assetsCol.doc('DOGE').set({
        id: 'DOGE',
        name: 'Dogecoin',
        symbol: 'DOGE',
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
    
    const solUsdtMarket = await marketsCol.doc('SOL-USDT').get();
    if (!solUsdtMarket.exists) {
        console.log("Seeding SOL-USDT market...");
      await marketsCol.doc('SOL-USDT').set({
        id: 'SOL-USDT',
        baseAssetId: 'SOL',
        quoteAssetId: 'USDT',
        minOrderSize: 0.01,
        pricePrecision: 2,
        quantityPrecision: 2,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }
    
    const adaUsdtMarket = await marketsCol.doc('ADA-USDT').get();
    if (!adaUsdtMarket.exists) {
        console.log("Seeding ADA-USDT market...");
      await marketsCol.doc('ADA-USDT').set({
        id: 'ADA-USDT',
        baseAssetId: 'ADA',
        quoteAssetId: 'USDT',
        minOrderSize: 1,
        pricePrecision: 4,
        quantityPrecision: 0,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const maticUsdtMarket = await marketsCol.doc('MATIC-USDT').get();
    if (!maticUsdtMarket.exists) {
        console.log("Seeding MATIC-USDT market...");
      await marketsCol.doc('MATIC-USDT').set({
        id: 'MATIC-USDT',
        baseAssetId: 'MATIC',
        quoteAssetId: 'USDT',
        minOrderSize: 1,
        pricePrecision: 4,
        quantityPrecision: 2,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const dogeUsdtMarket = await marketsCol.doc('DOGE-USDT').get();
    if (!dogeUsdtMarket.exists) {
        console.log("Seeding DOGE-USDT market...");
      await marketsCol.doc('DOGE-USDT').set({
        id: 'DOGE-USDT',
        baseAssetId: 'DOGE',
        quoteAssetId: 'USDT',
        minOrderSize: 10,
        pricePrecision: 6,
        quantityPrecision: 0,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const ethBtcMarket = await marketsCol.doc('ETH-BTC').get();
    if (!ethBtcMarket.exists) {
        console.log("Seeding ETH-BTC market...");
      await marketsCol.doc('ETH-BTC').set({
        id: 'ETH-BTC',
        baseAssetId: 'ETH',
        quoteAssetId: 'BTC',
        minOrderSize: 0.001,
        pricePrecision: 6,
        quantityPrecision: 4,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const solBtcMarket = await marketsCol.doc('SOL-BTC').get();
    if (!solBtcMarket.exists) {
        console.log("Seeding SOL-BTC market...");
      await marketsCol.doc('SOL-BTC').set({
        id: 'SOL-BTC',
        baseAssetId: 'SOL',
        quoteAssetId: 'BTC',
        minOrderSize: 0.1,
        pricePrecision: 8,
        quantityPrecision: 2,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const adaBtcMarket = await marketsCol.doc('ADA-BTC').get();
    if (!adaBtcMarket.exists) {
        console.log("Seeding ADA-BTC market...");
      await marketsCol.doc('ADA-BTC').set({
        id: 'ADA-BTC',
        baseAssetId: 'ADA',
        quoteAssetId: 'BTC',
        minOrderSize: 10,
        pricePrecision: 8,
        quantityPrecision: 0,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const maticBtcMarket = await marketsCol.doc('MATIC-BTC').get();
    if (!maticBtcMarket.exists) {
        console.log("Seeding MATIC-BTC market...");
      await marketsCol.doc('MATIC-BTC').set({
        id: 'MATIC-BTC',
        baseAssetId: 'MATIC',
        quoteAssetId: 'BTC',
        minOrderSize: 10,
        pricePrecision: 8,
        quantityPrecision: 2,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const dogeBtcMarket = await marketsCol.doc('DOGE-BTC').get();
    if (!dogeBtcMarket.exists) {
        console.log("Seeding DOGE-BTC market...");
      await marketsCol.doc('DOGE-BTC').set({
        id: 'DOGE-BTC',
        baseAssetId: 'DOGE',
        quoteAssetId: 'BTC',
        minOrderSize: 100,
        pricePrecision: 8,
        quantityPrecision: 0,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const solEthMarket = await marketsCol.doc('SOL-ETH').get();
    if (!solEthMarket.exists) {
        console.log("Seeding SOL-ETH market...");
      await marketsCol.doc('SOL-ETH').set({
        id: 'SOL-ETH',
        baseAssetId: 'SOL',
        quoteAssetId: 'ETH',
        minOrderSize: 0.1,
        pricePrecision: 6,
        quantityPrecision: 2,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const adaEthMarket = await marketsCol.doc('ADA-ETH').get();
    if (!adaEthMarket.exists) {
        console.log("Seeding ADA-ETH market...");
      await marketsCol.doc('ADA-ETH').set({
        id: 'ADA-ETH',
        baseAssetId: 'ADA',
        quoteAssetId: 'ETH',
        minOrderSize: 10,
        pricePrecision: 8,
        quantityPrecision: 0,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const maticEthMarket = await marketsCol.doc('MATIC-ETH').get();
    if (!maticEthMarket.exists) {
        console.log("Seeding MATIC-ETH market...");
      await marketsCol.doc('MATIC-ETH').set({
        id: 'MATIC-ETH',
        baseAssetId: 'MATIC',
        quoteAssetId: 'ETH',
        minOrderSize: 10,
        pricePrecision: 8,
        quantityPrecision: 2,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const adaSolMarket = await marketsCol.doc('ADA-SOL').get();
    if (!adaSolMarket.exists) {
        console.log("Seeding ADA-SOL market...");
      await marketsCol.doc('ADA-SOL').set({
        id: 'ADA-SOL',
        baseAssetId: 'ADA',
        quoteAssetId: 'SOL',
        minOrderSize: 1,
        pricePrecision: 6,
        quantityPrecision: 0,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const maticSolMarket = await marketsCol.doc('MATIC-SOL').get();
    if (!maticSolMarket.exists) {
        console.log("Seeding MATIC-SOL market...");
      await marketsCol.doc('MATIC-SOL').set({
        id: 'MATIC-SOL',
        baseAssetId: 'MATIC',
        quoteAssetId: 'SOL',
        minOrderSize: 1,
        pricePrecision: 6,
        quantityPrecision: 2,
        makerFee: 0.001,
        takerFee: 0.001,
        createdAt: new Date(),
      });
    }

    const dogeSolMarket = await marketsCol.doc('DOGE-SOL').get();
    if (!dogeSolMarket.exists) {
        console.log("Seeding DOGE-SOL market...");
      await marketsCol.doc('DOGE-SOL').set({
        id: 'DOGE-SOL',
        baseAssetId: 'DOGE',
        quoteAssetId: 'SOL',
        minOrderSize: 10,
        pricePrecision: 8,
        quantityPrecision: 0,
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
