
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
  // Add a pseudo-random element to ensure mock addresses are unique on retry
  // In a real app, the address derivation is deterministic, so this is not needed.
  const randomPart = Math.random().toString(36).substring(2, 8);
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
      let newIndex = 0;
      
      if (idxSnap.exists) {
        // If the index document exists, the next index is the current one + 1.
        newIndex = (idxSnap.data()?.lastIndex ?? -1) + 1;
      }
      
      // Update the index document with the new `lastIndex`.
      // If the doc doesn't exist, this will create it with `lastIndex: 0`.
      // This is now an atomic "increment and get" operation.
      tx.set(indexRef, { 
          lastIndex: newIndex, 
          updatedAt: FieldValue.serverTimestamp() 
      }, { merge: true });


      // In a real implementation, you would use a proper derivation library.
      // For example: const address = deriveBtcAddressFromXpub(process.env.XPUB_BTC, newIndex);
      const address = deriveMockAddress(coin, newIndex);
      
      const addrRef = firestore.collection('addresses').doc(address);
      const addrSnap = await tx.get(addrRef);

      // This check is a safeguard against hash collisions or logic errors.
      if (addrSnap.exists) {
          throw new Error(`Address collision detected for index ${newIndex}. Please retry.`);
      }

      // Create the mapping from the derived address to the user and the correct index.
      tx.set(addrRef, {
        coin,
        userId,
        index: newIndex, // Store the new index
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
