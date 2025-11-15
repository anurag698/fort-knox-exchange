
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
        { id: 'LTC', name: 'Litecoin', symbol: 'LTC' },
        { id: 'TRX', name: 'TRON', symbol: 'TRX' },
        { id: 'UNI', name: 'Uniswap', symbol: 'UNI' },
        { id: 'BNB', name: 'Binance Coin', symbol: 'BNB' },
        { id: 'BCH', name: 'Bitcoin Cash', symbol: 'BCH' },
        { id: 'XLM', name: 'Stellar', symbol: 'XLM' },
        { id: 'ATOM', name: 'Cosmos', symbol: 'ATOM' },
        { id: 'FIL', name: 'Filecoin', symbol: 'FIL' },
        { id: 'NEAR', name: 'NEAR Protocol', symbol: 'NEAR' },
        { id: 'APT', name: 'Aptos', symbol: 'APT' },
        { id: 'IMX', name: 'Immutable', symbol: 'IMX' },
        { id: 'SUI', name: 'Sui', symbol: 'SUI' },
        { id: 'SAND', name: 'The Sandbox', symbol: 'SAND' },
        { id: 'AAVE', name: 'Aave', symbol: 'AAVE' },
        { id: 'MKR', name: 'Maker', symbol: 'MKR' },
        { id: 'MANA', name: 'Decentraland', symbol: 'MANA' },
        { id: 'FTM', name: 'Fantom', symbol: 'FTM' },
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
      { id: 'LTC-USDT', base: 'LTC', quote: 'USDT', pricePrecision: 2, quantityPrecision: 3, minOrder: 0.01 },
      { id: 'TRX-USDT', base: 'TRX', quote: 'USDT', pricePrecision: 5, quantityPrecision: 0, minOrder: 10 },
      { id: 'UNI-USDT', base: 'UNI', quote: 'USDT', pricePrecision: 3, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'BNB-USDT', base: 'BNB', quote: 'USDT', pricePrecision: 2, quantityPrecision: 3, minOrder: 0.01 },
      { id: 'BCH-USDT', base: 'BCH', quote: 'USDT', pricePrecision: 2, quantityPrecision: 3, minOrder: 0.001 },
      { id: 'XLM-USDT', base: 'XLM', quote: 'USDT', pricePrecision: 5, quantityPrecision: 0, minOrder: 1 },
      { id: 'ATOM-USDT', base: 'ATOM', quote: 'USDT', pricePrecision: 3, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'FIL-USDT', base: 'FIL', quote: 'USDT', pricePrecision: 3, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'NEAR-USDT', base: 'NEAR', quote: 'USDT', pricePrecision: 3, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'APT-USDT', base: 'APT', quote: 'USDT', pricePrecision: 3, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'IMX-USDT', base: 'IMX', quote: 'USDT', pricePrecision: 4, quantityPrecision: 2, minOrder: 1 },
      { id: 'SUI-USDT', base: 'SUI', quote: 'USDT', pricePrecision: 4, quantityPrecision: 2, minOrder: 1 },
      { id: 'SAND-USDT', base: 'SAND', quote: 'USDT', pricePrecision: 4, quantityPrecision: 1, minOrder: 1 },
      { id: 'AAVE-USDT', base: 'AAVE', quote: 'USDT', pricePrecision: 2, quantityPrecision: 3, minOrder: 0.01 },
      { id: 'MKR-USDT', base: 'MKR', quote: 'USDT', pricePrecision: 2, quantityPrecision: 4, minOrder: 0.0001 },
      { id: 'MANA-USDT', base: 'MANA', quote: 'USDT', pricePrecision: 4, quantityPrecision: 1, minOrder: 1 },
      { id: 'FTM-USDT', base: 'FTM', quote: 'USDT', pricePrecision: 4, quantityPrecision: 1, minOrder: 1 },

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
      { id: 'LTC-BTC', base: 'LTC', quote: 'BTC', pricePrecision: 6, quantityPrecision: 3, minOrder: 0.01 },
      { id: 'TRX-BTC', base: 'TRX', quote: 'BTC', pricePrecision: 8, quantityPrecision: 0, minOrder: 100 },
      { id: 'UNI-BTC', base: 'UNI', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'BNB-BTC', base: 'BNB', quote: 'BTC', pricePrecision: 6, quantityPrecision: 3, minOrder: 0.01 },
      { id: 'BCH-BTC', base: 'BCH', quote: 'BTC', pricePrecision: 6, quantityPrecision: 3, minOrder: 0.001 },
      { id: 'XLM-BTC', base: 'XLM', quote: 'BTC', pricePrecision: 8, quantityPrecision: 0, minOrder: 10 },
      { id: 'ATOM-BTC', base: 'ATOM', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'FIL-BTC', base: 'FIL', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'NEAR-BTC', base: 'NEAR', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'APT-BTC', base: 'APT', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'IMX-BTC', base: 'IMX', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 1 },
      { id: 'SUI-BTC', base: 'SUI', quote: 'BTC', pricePrecision: 8, quantityPrecision: 2, minOrder: 1 },
      { id: 'SAND-BTC', base: 'SAND', quote: 'BTC', pricePrecision: 8, quantityPrecision: 1, minOrder: 10 },
      { id: 'AAVE-BTC', base: 'AAVE', quote: 'BTC', pricePrecision: 7, quantityPrecision: 3, minOrder: 0.01 },
      { id: 'MKR-BTC', base: 'MKR', quote: 'BTC', pricePrecision: 6, quantityPrecision: 4, minOrder: 0.001 },
      { id: 'MANA-BTC', base: 'MANA', quote: 'BTC', pricePrecision: 8, quantityPrecision: 1, minOrder: 10 },
      { id: 'FTM-BTC', base: 'FTM', quote: 'BTC', pricePrecision: 8, quantityPrecision: 1, minOrder: 10 },

      // ETH Pairs
      { id: 'SOL-ETH', base: 'SOL', quote: 'ETH', pricePrecision: 6, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'ADA-ETH', base: 'ADA', quote: 'ETH', pricePrecision: 8, quantityPrecision: 0, minOrder: 10 },
      { id: 'MATIC-ETH', base: 'MATIC', quote: 'ETH', pricePrecision: 8, quantityPrecision: 2, minOrder: 10 },
      { id: 'DOGE-ETH', base: 'DOGE', quote: 'ETH', pricePrecision: 8, quantityPrecision: 0, minOrder: 100 },
      { id: 'XRP-ETH', base: 'XRP', quote: 'ETH', pricePrecision: 8, quantityPrecision: 1, minOrder: 10 },
      { id: 'DOT-ETH', base: 'DOT', quote: 'ETH', pricePrecision: 8, quantityPrecision: 2, minOrder: 1 },
      { id: 'LINK-ETH', base: 'LINK', quote: 'ETH', pricePrecision: 8, quantityPrecision: 2, minOrder: 1 },
      { id: 'AVAX-ETH', base: 'AVAX', quote: 'ETH', pricePrecision: 8, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'LTC-ETH', base: 'LTC', quote: 'ETH', pricePrecision: 6, quantityPrecision: 3, minOrder: 0.01 },
      { id: 'TRX-ETH', base: 'TRX', quote: 'ETH', pricePrecision: 8, quantityPrecision: 0, minOrder: 100 },
      { id: 'UNI-ETH', base: 'UNI', quote: 'ETH', pricePrecision: 7, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'BNB-ETH', base: 'BNB', quote: 'ETH', pricePrecision: 6, quantityPrecision: 3, minOrder: 0.01 },
      { id: 'BCH-ETH', base: 'BCH', quote: 'ETH', pricePrecision: 6, quantityPrecision: 3, minOrder: 0.001 },
      { id: 'XLM-ETH', base: 'XLM', quote: 'ETH', pricePrecision: 8, quantityPrecision: 0, minOrder: 10 },
      { id: 'ATOM-ETH', base: 'ATOM', quote: 'ETH', pricePrecision: 7, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'FIL-ETH', base: 'FIL', quote: 'ETH', pricePrecision: 7, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'NEAR-ETH', base: 'NEAR', quote: 'ETH', pricePrecision: 7, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'APT-ETH', base: 'APT', quote: 'ETH', pricePrecision: 7, quantityPrecision: 2, minOrder: 0.1 },
      { id: 'IMX-ETH', base: 'IMX', quote: 'ETH', pricePrecision: 7, quantityPrecision: 2, minOrder: 1 },
      { id: 'SUI-ETH', base: 'SUI', quote: 'ETH', pricePrecision: 7, quantityPrecision: 2, minOrder: 1 },
      { id: 'SAND-ETH', base: 'SAND', quote: 'ETH', pricePrecision: 7, quantityPrecision: 1, minOrder: 10 },
      { id: 'AAVE-ETH', base: 'AAVE', quote: 'ETH', pricePrecision: 6, quantityPrecision: 3, minOrder: 0.01 },
      { id: 'MKR-ETH', base: 'MKR', quote: 'ETH', pricePrecision: 5, quantityPrecision: 4, minOrder: 0.001 },
      { id: 'MANA-ETH', base: 'MANA', quote: 'ETH', pricePrecision: 7, quantityPrecision: 1, minOrder: 10 },
      { id: 'FTM-ETH', base: 'FTM', quote: 'ETH', pricePrecision: 7, quantityPrecision: 1, minOrder: 10 },
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
