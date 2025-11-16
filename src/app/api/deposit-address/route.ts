
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { deriveBtcAddressFromXpub } from '@/lib/btc-address';
import { deriveEthAddressFromXpub } from '@/lib/eth-address';

export async function POST(request: Request) {
  try {
    const { firestore, FieldValue } = getFirebaseAdmin();
    const body = await request.json();
    const { userId, coin } = body ?? {};
    if (!userId || !coin) {
      return NextResponse.json({ error: 'userId and coin required' }, { status: 400 });
    }

    const db = firestore;
    const coinUpper = coin.toString().toUpperCase();

    const address = await db.runTransaction(async (tx) => {
      const indexRef = db.collection('addressIndexes').doc(coinUpper);
      // READ first
      const idxSnap = await tx.get(indexRef);
      const lastIndex = idxSnap.exists ? Number(idxSnap.data()?.lastIndex ?? -1) : -1;
      const newIndex = lastIndex + 1;

      // DERIVE address (pure local computation)
      let derived: string;
      if (coinUpper === 'BTC') {
        const xpub = process.env.XPUB_BTC;
        if (!xpub) throw new Error('XPUB_BTC env not configured');
        derived = deriveBtcAddressFromXpub(xpub, newIndex);
      } else if (['ETH', 'USDT', 'USDC', 'MATIC'].includes(coinUpper)) {
        const ethXpub = process.env.ETH_XPUB;
        if (!ethXpub) throw new Error('ETH_XPUB env not configured');
        derived = deriveEthAddressFromXpub(ethXpub, newIndex);
      } else {
        throw new Error('unsupported coin: ' + coin);
      }

      // ALL READS DONE — now do writes
      if (!idxSnap.exists) {
        tx.set(indexRef, { lastIndex: newIndex, createdAt: FieldValue.serverTimestamp() });
      } else {
        tx.update(indexRef, { lastIndex: newIndex });
      }

      const addrRef = db.collection('addresses').doc(derived);
      tx.set(addrRef, {
        coin: coinUpper,
        userId,
        index: newIndex,
        createdAt: FieldValue.serverTimestamp(),
        used: false,
      });

      return derived;
    });

    return NextResponse.json({ address });
  } catch (err: any) {
    console.error('deposit-address error', err);
    return NextResponse.json({ error: err?.message || 'internal' }, { status: 500 });
  }
}
