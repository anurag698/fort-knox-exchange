
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
  // NOTE: This mock includes a random element to ensure uniqueness during testing,
  // as the index alone might reset in some dev environments.
  // A real HD wallet derivation is deterministic and does not need this.
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${coinPrefix}-addr-mock-${indexHex}-${randomPart}`;
};

export async function POST(request: Request) {
  const body = await request.json();
  const validation = requestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { userId, coin } = validation.data;
  const { firestore, FieldValue } = getFirebaseAdmin();
  

  try {
    const derivedAddress = await firestore.runTransaction(async (tx) => {
      const indexRef = firestore.collection('addressIndexes').doc(coin);

      // --- 1. READS FIRST ---
      // Atomically read the current index for the specified coin.
      const idxSnap = await tx.get(indexRef);

      // --- 2. COMPUTE NEW STATE (In-Memory) ---
      // Determine the next available index. If the document doesn't exist, start from 0.
      let newIndex = 0;
      if (idxSnap.exists) {
        // Increment the last known index by 1.
        newIndex = (idxSnap.data()?.lastIndex ?? -1) + 1;
      }
      
      // Derive the new address using the computed index. This is a pure function.
      const address = deriveMockAddress(coin, newIndex);
      const addrRef = firestore.collection('addresses').doc(address);
      
      // Safeguard against extremely rare hash collisions or logic errors.
      // This read is for validation and must also happen before writes.
      const addrSnap = await tx.get(addrRef);
      if (addrSnap.exists) {
          // If for some reason this address is already in the DB, abort the transaction.
          throw new Error(`Address collision detected for index ${newIndex}. Please retry.`);
      }

      // --- 3. WRITES LAST ---
      // All reads are complete. Now, perform all write operations.
      
      // Update the index document with the new `lastIndex`.
      // If the doc doesn't exist, this will create it with `lastIndex: 0`.
      tx.set(indexRef, { 
          lastIndex: newIndex, 
          updatedAt: FieldValue.serverTimestamp() 
      }, { merge: true });

      // Create the mapping from the derived address to the user and the correct index.
      tx.set(addrRef, {
        coin,
        userId,
        index: newIndex,
        createdAt: FieldValue.serverTimestamp(),
        used: false,
      });

      // The return value of the transaction function is the result of the entire operation.
      return address;
    });

    return NextResponse.json({ address: derivedAddress });

  } catch (err) {
    const error = err as Error;
    console.error(`[API/deposit-address] Failed for user ${userId} and coin ${coin}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to generate deposit address.' }, { status: 500 });
  }
}
