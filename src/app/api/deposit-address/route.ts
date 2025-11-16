
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
  try {
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
    console.info('[deposit-address] request', { userId, assetId: symbol });

    const assetsCol = firestore.collection('assets');
    const assetQuery = assetsCol.where('symbol', '==', symbol).limit(1);
    const assetSnapshot = await assetQuery.get();

    if (assetSnapshot.empty) {
      return NextResponse.json({ error: `Unsupported asset: ${symbol}` }, { status: 400 });
    }

    const assetData = assetSnapshot.docs[0].data() as Asset;
    console.info('[deposit-address] token metadata', assetData ? assetData : 'not found');
    
    const chainType = assetData.symbol === 'BTC' ? 'BTC' : 'ETH';

    if (chainType === 'ETH') {
        const ethXpub = process.env.ETH_XPUB;
        if (!ethXpub) {
            console.error('[deposit-address] missing ETH_XPUB');
            return NextResponse.json({ error: 'ETH_XPUB env not configured' }, { status: 500 });
        }

        const address = await firestore.runTransaction(async (tx) => {
            const addressesCol = firestore.collection('addresses');
            const existingAddressQuery = addressesCol.where('userId', '==', userId).where('coin', '==', 'ETH').limit(1);
            const existingAddrSnap = await tx.get(existingAddressQuery);

            if (!existingAddrSnap.empty) {
                return existingAddrSnap.docs[0].data().address;
            }

            const ethIndexRef = firestore.collection('addressIndexes').doc('ETH');
            const ethIdxSnap = await tx.get(ethIndexRef);
            const lastIndex = ethIdxSnap.exists ? Number(ethIdxSnap.data()?.lastIndex ?? -1) : -1;
            const newIndex = lastIndex + 1;

            const derivedAddress = deriveEthAddressFromXpub(ethXpub, newIndex);

            if (!ethIdxSnap.exists) {
                tx.set(ethIndexRef, { lastIndex: newIndex, createdAt: FieldValue.serverTimestamp() });
            } else {
                tx.update(ethIndexRef, { lastIndex: newIndex });
            }

            const newAddrRef = firestore.collection('addresses').doc(derivedAddress);
            tx.set(newAddrRef, {
                coin: 'ETH',
                userId,
                index: newIndex,
                createdAt: FieldValue.serverTimestamp(),
                used: false,
            });

            return derivedAddress;
        });

        return NextResponse.json({ address, chain: 'ETH' });
    }

    if (chainType === 'BTC') {
        const btcXpub = process.env.BTC_XPUB;
        if (!btcXpub) {
            console.error('[deposit-address] missing BTC_XPUB');
            return NextResponse.json({ error: 'BTC_XPUB env not configured' }, { status: 500 });
        }

        const address = await firestore.runTransaction(async (tx) => {
            const btcIndexRef = firestore.collection('addressIndexes').doc('BTC');
            const btcIdxSnap = await tx.get(btcIndexRef);
            const lastIndex = btcIdxSnap.exists ? Number(btcIdxSnap.data()?.lastIndex ?? -1) : -1;
            const newIndex = lastIndex + 1;

            const derivedAddress = deriveBtcAddressFromXpub(btcXpub, newIndex);

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

        return NextResponse.json({ address, chain: 'BTC' });
    }

    return NextResponse.json({ error: `Unsupported chain type for asset ${symbol}` }, { status: 400 });
  } catch (err: any) {
    console.error('[deposit-address] unexpected error:', err?.stack || err?.message || err);
    return NextResponse.json({ error: 'internal server error', detail: err?.message || 'unknown' }, { status: 500 });
  }
}
