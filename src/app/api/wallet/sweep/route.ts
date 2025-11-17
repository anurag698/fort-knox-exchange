// src/app/api/wallet/sweep/route.ts
import { NextResponse } from "next/server";
import { sweepWalletToSafe } from "@/lib/wallet-service";
// In a real app, you'd get the encrypted key from Firestore and decrypt it.
// import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { privateKey } = await req.json();
    // const { userId, walletId = 'eth' } = await req.json();
    //
    // // 1. Fetch encrypted key from Firestore
    // const { firestore } = getFirebaseAdmin();
    // const doc = await firestore.collection('users').doc(userId).collection('wallets').doc(walletId).get();
    // const encryptedKey = doc.data()?.encryptedPrivateKey;
    //
    // // 2. Decrypt the key
    // const privateKey = decrypt(encryptedKey); // Pseudocode for decryption

    if (!privateKey) {
      return NextResponse.json({ error: "Private key required for sweep" }, { status: 400 });
    }

    const result = await sweepWalletToSafe(privateKey);

    return NextResponse.json({
      status: result.status,
      transactionHash: result.hash,
    });

  } catch (err: any) {
    console.error("[API] Error sweeping wallet:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
