
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { deriveBtcAddressFromXpub } from '@/lib/btc-address';
import { deriveEthAddressFromXpub } from '@/lib/eth-address';
import type { Asset } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const body = await request.json();
    const { userId, assetId } = body ?? {};

    if (!userId || !assetId) {
      return NextResponse.json({ error: 'userId and assetId are required' }, { status: 400 });
    }

    const db = firestore;
    
    // 1. Look up the asset metadata from the `assets` collection
    const assetRef = db.collection('assets').doc(assetId);
    const assetDoc = await assetRef.get();

    if (!assetDoc.exists) {
        return NextResponse.json({ error: `Unsupported asset: ${assetId}` }, { status: 400 });
    }
    
    const assetData = assetDoc.data() as Asset;
    const chain = assetData.symbol === 'BTC' ? 'BTC' : 'ETH'; // Simplified: Assume ETH-based or BTC

    // 2. Run transaction to get or create the appropriate deposit address
    const address = await db.runTransaction(async (tx) => {
      // For ERC20 tokens or ETH itself, we need the user's single ETH address
      if (chain === 'ETH') {
          const ethIndexRef = db.collection('addressIndexes').doc('ETH');
          const ethIdxSnap = await tx.get(ethIndexRef);
          
          // Check if an ETH address already exists for this user
          const existingAddressesQuery = db.collection('addresses')
              .where('userId', '==', userId)
              .where('coin', '==', 'ETH')
              .limit(1);
          const existingAddrSnap = await tx.get(existingAddressesQuery);
          
          if (!existingAddrSnap.empty) {
              return existingAddrSnap.docs[0].data().address;
          }

          // If not, derive a new one
          const lastIndex = ethIdxSnap.exists ? Number(ethIdxSnap.data()?.lastIndex ?? -1) : -1;
          const newIndex = lastIndex + 1;
          
          const ethXpub = process.env.ETH_XPUB;
          if (!ethXpub) throw new Error('ETH_XPUB env not configured');
          const derived = deriveEthAddressFromXpub(ethXpub, newIndex);

          if (!ethIdxSnap.exists) {
              tx.set(ethIndexRef, { lastIndex: newIndex, createdAt: FieldValue.serverTimestamp() });
          } else {
              tx.update(ethIndexRef, { lastIndex: newIndex });
          }

          const addrRef = db.collection('addresses').doc(derived);
          tx.set(addrRef, {
              coin: 'ETH', // Store it as an ETH address
              userId,
              index: newIndex,
              createdAt: FieldValue.serverTimestamp(),
              used: false,
          });

          return derived;

      } else if (chain === 'BTC') {
          // For BTC, derive a new, unique address
          const btcIndexRef = db.collection('addressIndexes').doc('BTC');
          const btcIdxSnap = await tx.get(btcIndexRef);
          const lastIndex = btcIdxSnap.exists ? Number(btcIdxSnap.data()?.lastIndex ?? -1) : -1;
          const newIndex = lastIndex + 1;

          const btcXpub = process.env.XPUB_BTC;
          if (!btcXpub) throw new Error('XPUB_BTC env not configured');
          const derived = deriveBtcAddressFromXpub(btcXpub, newIndex);
          
          if (!btcIdxSnap.exists) {
            tx.set(btcIndexRef, { lastIndex: newIndex, createdAt: FieldValue.serverTimestamp() });
          } else {
            tx.update(btcIndexRef, { lastIndex: newIndex });
          }
          
          const addrRef = db.collection('addresses').doc(derived);
          tx.set(addrRef, {
            coin: 'BTC',
            userId,
            index: newIndex,
            createdAt: FieldValue.serverTimestamp(),
            used: false,
          });

          return derived;
      } else {
          throw new Error(`Chain type for asset ${assetId} is not supported.`);
      }
    });

    return NextResponse.json({ address });
  } catch (err: any) {
    console.error('deposit-address error', err);
    return NextResponse.json({ error: err?.message || 'internal' }, { status: 500 });
  }
}
