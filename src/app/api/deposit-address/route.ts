
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { deriveBtcAddressFromXpub } from '@/lib/btc-address';
import { deriveEthAddressFromXpub } from '@/lib/eth-address';
import type { Asset } from '@/lib/types';

// Helper: standardize incoming asset key (accept asset, token, assetId)
function normalizeInput(body: any) {
  const userId = body?.userId || body?.uid || body?.user || null;
  const assetId = (body?.assetId || body?.asset || body?.token || body?.symbol || null);
  return { userId, assetId };
}


export async function POST(request: Request) {
  const { firestore, FieldValue } = getFirebaseAdmin();
  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { userId, assetId } = normalizeInput(body);

  if (!userId || !assetId) {
    return NextResponse.json({ error: 'userId and assetId are required' }, { status: 400 });
  }
  
  const symbol = String(assetId).toUpperCase();

  try {
    const assetsCol = firestore.collection('assets');
    const assetQuery = assetsCol.where('symbol', '==', symbol).limit(1);
    const assetSnapshot = await assetQuery.get();

    if (assetSnapshot.empty) {
      return NextResponse.json({ error: `Unsupported asset: ${symbol}` }, { status: 400 });
    }

    const assetData = assetSnapshot.docs[0].data() as Asset;
    // Chain can be explicitly stored on the asset or inferred.
    // Here we simplify: BTC is 'BTC' chain, all others are on 'ETH' compatible chains.
    const chainType = assetData.symbol === 'BTC' ? 'BTC' : 'ETH';

    // =========================================================================
    // ETH & ERC20 Token Logic: Return a single, persistent address for the user
    // =========================================================================
    if (chainType === 'ETH') {
      const address = await firestore.runTransaction(async (tx) => {
        // 1. READ: Check if an ETH address already exists for this user
        const addressesCol = firestore.collection('addresses');
        const existingAddressQuery = addressesCol.where('userId', '==', userId).where('coin', '==', 'ETH').limit(1);
        const existingAddrSnap = await tx.get(existingAddressQuery);

        if (!existingAddrSnap.empty) {
          return existingAddrSnap.docs[0].data().address;
        }

        // 2. READ: If not, get the next available index for derivation
        const ethIndexRef = firestore.collection('addressIndexes').doc('ETH');
        const ethIdxSnap = await tx.get(ethIndexRef);
        const lastIndex = ethIdxSnap.exists ? Number(ethIdxSnap.data()?.lastIndex ?? -1) : -1;
        const newIndex = lastIndex + 1;

        // 3. DERIVE: Perform the derivation (pure computation, no side-effects)
        const ethXpub = process.env.ETH_XPUB;
        if (!ethXpub) {
          console.error('FATAL: ETH_XPUB environment variable is not configured.');
          throw new Error('ETH_XPUB env not configured');
        }
        const derivedAddress = deriveEthAddressFromXpub(ethXpub, newIndex);

        // 4. WRITE: Update the index and create the new address mapping
        if (!ethIdxSnap.exists) {
          tx.set(ethIndexRef, { lastIndex: newIndex, createdAt: FieldValue.serverTimestamp() });
        } else {
          tx.update(ethIndexRef, { lastIndex: newIndex });
        }

        const newAddrRef = firestore.collection('addresses').doc(derivedAddress);
        tx.set(newAddrRef, {
          coin: 'ETH', // The master address is always an ETH one
          userId,
          index: newIndex,
          createdAt: FieldValue.serverTimestamp(),
          used: false,
        });

        return derivedAddress;
      });

      return NextResponse.json({ address });
    }

    // ==========================================================
    // BTC Logic: Derive a new, unique address for each request
    // ==========================================================
    if (chainType === 'BTC') {
      const address = await firestore.runTransaction(async (tx) => {
        // 1. READ: Get the next available index
        const btcIndexRef = firestore.collection('addressIndexes').doc('BTC');
        const btcIdxSnap = await tx.get(btcIndexRef);
        const lastIndex = btcIdxSnap.exists ? Number(btcIdxSnap.data()?.lastIndex ?? -1) : -1;
        const newIndex = lastIndex + 1;

        // 2. DERIVE: Perform derivation
        const btcXpub = process.env.BTC_XPUB;
        if (!btcXpub) {
          console.error('FATAL: BTC_XPUB environment variable is not configured.');
          throw new Error('BTC_XPUB env not configured');
        }
        const derivedAddress = deriveBtcAddressFromXpub(btcXpub, newIndex);

        // 3. WRITE: Update index and create address mapping
        if (!btcIdxSnap.exists) {
          tx.set(btcIndexRef, { lastIndex: newIndex, createdAt: FieldValue.serverTimestamp() });
        } else {
          tx.update(btcIndexRef, { lastIndex: newIndex });
        }
        
        const newAddrRef = firestore.collection('addresses').doc(derivedAddress);
        tx.set(newAddrRef, {
          coin: 'BTC',
          userId,
          index: newIndex,
          createdAt: FieldValue.serverTimestamp(),
          used: false,
        });

        return derivedAddress;
      });

      return NextResponse.json({ address });
    }

    return NextResponse.json({ error: `Unsupported chain type for asset ${symbol}` }, { status: 400 });
  } catch (err: any) {
    console.error('deposit-address error:', { message: err.message, stack: err.stack });
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
