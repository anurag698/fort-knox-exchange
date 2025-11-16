// scripts/seed-tokens.js
import { getFirebaseAdmin } from '../src/lib/firebase-admin.js';

async function seedTokens() {
  const { firestore, FieldValue } = getFirebaseAdmin();
  console.log('Starting to seed tokens...');
  
  const tokensToSeed = [
      { id: 'USDT', name: 'Tether', symbol: 'USDT', contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, chain: 'POLYGON' },
      { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', contractAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8, chain: 'POLYGON' }, // This is WBTC on Polygon
      { id: 'ETH', name: 'Ethereum', symbol: 'ETH', contractAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, chain: 'POLYGON' }, // This is WETH on Polygon
      { id: 'AAVE', name: 'Aave', symbol: 'AAVE', contractAddress: '0xD6DF932A45C0f255f85145f286EA0b292B21C90B', decimals: 18, chain: 'POLYGON' },
      { id: 'LINK', name: 'Chainlink', symbol: 'LINK', contractAddress: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaAa054', decimals: 18, chain: 'POLYGON' },
      { id: 'UNI', name: 'Uniswap', symbol: 'UNI', contractAddress: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', decimals: 18, chain: 'POLYGON' },
      { id: 'SHIB', name: 'Shiba Inu', symbol: 'SHIB', contractAddress: '0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec', decimals: 18, chain: 'POLYGON' }
  ];

  const batch = firestore.batch();

  for (const token of tokensToSeed) {
    const docRef = firestore.collection('assets').doc(token.symbol);
    batch.set(docRef, { ...token, createdAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  try {
    await batch.commit();
    console.log(`Successfully seeded/updated ${tokensToSeed.length} tokens.`);
    return 0;
  } catch (error) {
    console.error('Error seeding tokens:', error);
    return 1;
  }
}

// This construct allows the script to be imported or run directly.
if (process.argv[1] && process.argv[1].includes('seed-tokens.js')) {
    seedTokens().then(process.exit);
}

export { seedTokens };
