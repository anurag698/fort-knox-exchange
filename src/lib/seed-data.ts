
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
        { id: 'USDT', name: 'Tether', symbol: 'USDT', contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
        { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', contractAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8 },
        { id: 'ETH', name: 'Ethereum', symbol: 'ETH', contractAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
        { id: 'SOL', name: 'Solana', symbol: 'SOL', contractAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 }, // This is WMATIC as placeholder for SOL on Polygon
        { id: 'ADA', name: 'Cardano', symbol: 'ADA', contractAddress: '0x3B38753A261315b452714526d71374A7C7915159', decimals: 18 },
        { id: 'MATIC', name: 'Polygon', symbol: 'MATIC', contractAddress: '0x0000000000000000000000000000000000001010', decimals: 18 },
        { id: 'DOGE', name: 'Dogecoin', symbol: 'DOGE', contractAddress: '0x81bAF65A1489063544521A1072D82937754f2483', decimals: 8 },
        { id: 'XRP', name: 'Ripple', symbol: 'XRP', contractAddress: '0x2d6768112e5A6112E29Db1d4413345753A5A3514', decimals: 6 },
        { id: 'DOT', name: 'Polkadot', symbol: 'DOT', contractAddress: '0x76B0a07204f1285223A4315265649d2b2c159846', decimals: 10 },
        { id: 'LINK', name: 'Chainlink', symbol: 'LINK', contractAddress: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaAa054', decimals: 18 },
        { id: 'SHIB', name: 'Shiba Inu', symbol: 'SHIB', contractAddress: '0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec', decimals: 18 },
        { id: 'AVAX', name: 'Avalanche', symbol: 'AVAX', contractAddress: '0x2C89bbc92BD86F8075d1DEcc58C7F4E0107f286b', decimals: 18 },
        { id: 'LTC', name: 'Litecoin', symbol: 'LTC', contractAddress: '0x43E515B442aCDE1B45c43236A015423075153549', decimals: 8 },
        { id: 'TRX', name: 'TRON', symbol: 'TRX', contractAddress: '0x85E076361Cc813A90e6CF220C444c34d3C42b46d', decimals: 6 },
        { id: 'UNI', name: 'Uniswap', symbol: 'UNI', contractAddress: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', decimals: 18 },
        { id: 'BNB', name: 'Binance Coin', symbol: 'BNB', contractAddress: '0x5335E8715201B46b18981Ce7C021dA45915d31b0', decimals: 18 },
        { id: 'BCH', name: 'Bitcoin Cash', symbol: 'BCH', contractAddress: '0x3228a635b756997a339311A46761A63901b09C48', decimals: 8 },
        { id: 'XLM', name: 'Stellar', symbol: 'XLM', contractAddress: '0x6288A5832a8A29A6623631389886315214470438', decimals: 7 },
        { id: 'ATOM', name: 'Cosmos', symbol: 'ATOM', contractAddress: '0xac51C4c48Dc3116487eD4BC16542e27B5694Da1b', decimals: 6 },
        { id: 'FIL', name: 'Filecoin', symbol: 'FIL', contractAddress: '0x333423DE45722384732569651589454154244433', decimals: 18 },
        { id: 'NEAR', name: 'NEAR Protocol', symbol: 'NEAR', contractAddress: '0x8f2B158d6971578A739893322D877B042065839C', decimals: 24 },
        { id: 'APT', name: 'Aptos', symbol: 'APT', contractAddress: '0x6F2902355431522f778536f6A785191B981b2D1A', decimals: 8 },
        { id: 'IMX', name: 'Immutable', symbol: 'IMX', contractAddress: '0x0c9fc9549add84422F358055309A18967982f173', decimals: 18 },
        { id: 'SUI', name: 'Sui', symbol: 'SUI', contractAddress: '0x354b3a8863A2f93A17a8a65f9E5f4581f1d1d86c', decimals: 9 },
        { id: 'SAND', name: 'The Sandbox', symbol: 'SAND', contractAddress: '0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683', decimals: 18 },
        { id: 'AAVE', name: 'Aave', symbol: 'AAVE', contractAddress: '0xD6DF932A45C0f255f85145f286EA0b292B21C90B', decimals: 18 },
        { id: 'MKR', name: 'Maker', symbol: 'MKR', contractAddress: '0x6fE3d0F096FC932A105D61EB2586B527A6754543', decimals: 18 },
        { id: 'MANA', name: 'Decentraland', symbol: 'MANA', contractAddress: '0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4', decimals: 18 },
        { id: 'FTM', name: 'Fantom', symbol: 'FTM', contractAddress: '0x4E15361FD6b4BB609Fa63C81A2be19d873717870', decimals: 18 },
    ];

    for (const asset of assetsToSeed) {
        const docRef = assetsCol.doc(asset.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            console.log(`Seeding ${asset.symbol} asset...`);
            await docRef.set({
                ...asset,
                createdAt: FieldValue.serverTimestamp(),
            });
        } else {
             // Ensure contract address and decimals are present
             const data = doc.data();
             if (!data?.contractAddress || !data?.decimals) {
                 await docRef.update({
                     contractAddress: asset.contractAddress,
                     decimals: asset.decimals
                 });
             }
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
