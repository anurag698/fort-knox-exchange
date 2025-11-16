
import { NextResponse, type NextRequest } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';
import { z } from 'zod';
import { deriveBtcAddressFromXpub } from '@/lib/btc-address';
import { deriveEthAddressFromXpub } from '@/lib/eth-address';

const requestSchema = z.object({
  userId: z.string(),
  coin: z.string(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = requestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { userId, coin } = validation.data;
  const db = getFirestore();

  try {
    const address = await db.runTransaction(async (tx) => {
      const indexRef = db.collection('addressIndexes').doc(coin.toUpperCase());
      const idxSnap = await tx.get(indexRef);

      const newIndex = idxSnap.exists ? (Number(idxSnap.data()?.lastIndex ?? -1) + 1) : 0;
      
      let derivedAddress: string;
      const coinUpperCase = coin.toUpperCase();

      if (coinUpperCase === 'BTC') {
        const xpub = process.env.XPUB_BTC;
        if (!xpub) throw new Error('XPUB_BTC env var not configured');
        derivedAddress = deriveBtcAddressFromXpub(xpub, newIndex);
      } else if (['ETH', 'USDT', 'USDC', 'MATIC'].includes(coinUpperCase)) { // ERC20 tokens use ETH address
        const ethXpub = process.env.ETH_XPUB;
        if (!ethXpub) throw new Error('ETH_XPUB env var not configured');
        derivedAddress = deriveEthAddressFromXpub(ethXpub, newIndex);
      } else {
        throw new Error(`Unsupported coin for address generation: ${coin}`);
      }
      
      const addressRef = db.collection('addresses').doc(derivedAddress);
      
      // READ phase is done, now perform all WRITES
      if (idxSnap.exists) {
        tx.update(indexRef, { lastIndex: newIndex });
      } else {
        const { serverTimestamp } = await import('firebase-admin/firestore');
        tx.set(indexRef, { lastIndex: newIndex, createdAt: serverTimestamp() });
      }

      const { serverTimestamp } = await import('firebase-admin/firestore');
      tx.set(addressRef, {
        coin: coinUpperCase,
        userId,
        index: newIndex,
        createdAt: serverTimestamp(),
        used: false,
      });

      return derivedAddress;
    });

    return NextResponse.json({ address });

  } catch (err) {
    const error = err as Error;
    console.error(`[API/deposit-address] Failed for user ${userId} and coin ${coin}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to generate deposit address.' }, { status: 500 });
  }
}
