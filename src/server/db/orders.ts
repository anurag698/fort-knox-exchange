import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { collection, collectionGroup, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { SpotPosition } from '@/lib/types';


export async function getUserTradesHistory(userId: string) {
  const { firestore } = getFirebaseAdmin();

  const q = query(
    collectionGroup(firestore, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function getUserTradeFills(userId: string) {
  const { firestore } = getFirebaseAdmin();

  // In a real app, this might query a global 'fills' or 'trades' collection.
  // For this example, we'll assume fills are stored in a user's subcollection.
  // A 'trades' subcollection seems more appropriate than 'fills'.
  const q = query(
    collectionGroup(firestore, 'trades'),
    where('userId', '==', userId),
    orderBy('executedAt', 'desc')
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}


export async function getUserPositions(userId: string): Promise<SpotPosition[]> {
  const { firestore } = getFirebaseAdmin();
  
  // Read user balances
  const balSnap = await getDocs(
    query(collection(firestore, 'users', userId, 'balances'))
  );

  // Read markets + tickers
  const marketsSnap = await getDocs(collection(firestore, 'markets'));
  const tickersSnap = await getDocs(collection(firestore, 'market_data'));

  const markets = marketsSnap.docs.map(d => d.data());
  const tickers = tickersSnap.docs.map(d => d.data());

  const tickerMap = Object.fromEntries(
    tickers.map(t => [t.id, t.price])
  );

  const positions: SpotPosition[] = [];

  for (const b of balSnap.docs) {
    const data = b.data();
    const assetId = data.assetId;
    const quantity = data.available + (data.locked || 0);

    // Skip zero balance coins
    if (!quantity || quantity <= 0) continue;
    if (assetId === 'USDT') continue; // Don't show USDT as a position

    // Find the market where this asset is the base asset (e.g., BTC in BTC-USDT)
    const market = markets.find(m => m.baseAssetId === assetId);
    if (!market) continue;

    const mId = market.id;
    const marketPrice = tickerMap[mId] ?? null;

    // This is a simplification. A real avgPrice would be calculated from trade history.
    const avgPrice = data.avgPrice ?? marketPrice; // Fallback to current price if no avg
    const value = marketPrice ? quantity * marketPrice : null;

    let pnl = null;
    let pnlPercent = null;

    if (avgPrice && marketPrice) {
      pnl = (marketPrice - avgPrice) * quantity;
      pnlPercent = avgPrice > 0 ? ((marketPrice - avgPrice) / avgPrice) * 100 : 0;
    }

    positions.push({
      assetId,
      quantity,
      avgPrice,
      marketPrice,
      value,
      pnl,
      pnlPercent,
    });
  }

  return positions;
}
