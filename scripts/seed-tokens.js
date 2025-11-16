// scripts/seed-tokens.js
import admin from 'firebase-admin';
import { getFirebaseAdmin } from '../src/lib/firebase-admin.js';

const { firestore: db, FieldValue } = getFirebaseAdmin();

const tokens = [
  { id: 'AAVE', symbol: 'AAVE', name: 'Aave', chain: 'ETH', type: 'ERC20', contractAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', decimals: 18, enabled: true },
  { id: 'USDT', symbol: 'USDT', name: 'Tether', chain: 'ETH', type: 'ERC20', contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6, enabled: true },
  { id: 'SHIB', symbol: 'SHIB', name: 'Shiba Inu', chain: 'ETH', type: 'ERC20', contractAddress: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', decimals: 18, enabled: true },
  { id: 'UNI', symbol: 'UNI', name: 'Uniswap', chain: 'ETH', type: 'ERC20', contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', decimals: 18, enabled: true },
  { id: 'LINK', symbol: 'LINK', name: 'Chainlink', chain: 'ETH', type: 'ERC20', contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca', decimals: 18, enabled: true },
];

async function seedTokens() {
  console.log('Starting to seed tokens...');
  const batch = db.batch();

  for (const token of tokens) {
    // Using asset symbol as ID for consistency with existing data
    const docRef = db.collection('assets').doc(token.symbol);
    batch.set(docRef, { ...token, createdAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  await batch.commit();
  console.log(`Successfully seeded/updated ${tokens.length} tokens.`);
}

seedTokens().catch(error => {
  console.error('Error seeding tokens:', error);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
