
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';

const requestSchema = z.object({
  userId: z.string(),
  coin: z.string(),
});

// Mock derivation function. In a real app, this would use libraries like
// bitcoinjs-lib or ethers.js with an xpub.
const deriveMockAddress = (coin: string, index: number): string => {
  const coinPrefix = coin.toLowerCase();
  const indexHex = index.toString(16).padStart(6, '0');
  const randomPart = Math.random().toString(36).substring(2, 12);
  return `${coinPrefix}-addr-${indexHex}-${randomPart}`;
};

export async function POST(request: Request) {
  const body = await request.json();
  const validation = requestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { userId, coin } = validation.data;
  const { firestore, FieldValue } = getFirebaseAdmin();
  const indexRef = firestore.collection('addressIndexes').doc(coin);

  try {
    const derivedAddress = await firestore.runTransaction(async (tx) => {
      const idxSnap = await tx.get(indexRef);
      let lastIndex = 0;
      if (!idxSnap.exists) {
        tx.set(indexRef, { lastIndex: 0, createdAt: FieldValue.serverTimestamp() });
        lastIndex = 0;
      } else {
        lastIndex = (idxSnap.data()?.lastIndex ?? -1) + 1;
        tx.update(indexRef, { lastIndex, updatedAt: FieldValue.serverTimestamp() });
      }

      // In a real implementation, you would use a proper derivation library.
      // For example: const address = deriveBtcAddressFromXpub(process.env.XPUB_BTC, lastIndex);
      const address = deriveMockAddress(coin, lastIndex);
      
      const addrRef = firestore.collection('addresses').doc(address);
      const addrSnap = await tx.get(addrRef);

      if (addrSnap.exists) {
          throw new Error(`Address collision detected for index ${lastIndex}. Please retry.`);
      }

      tx.set(addrRef, {
        coin,
        userId,
        index: lastIndex,
        createdAt: FieldValue.serverTimestamp(),
        used: false,
      });

      return address;
    });

    return NextResponse.json({ address: derivedAddress });

  } catch (err) {
    const error = err as Error;
    console.error(`[API/deposit-address] Failed for user ${userId} and coin ${coin}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to generate deposit address.' }, { status: 500 });
  }
}
