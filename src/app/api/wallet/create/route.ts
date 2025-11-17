// src/app/api/wallet/create/route.ts
import { NextResponse } from "next/server";
import { createDepositWallet } from "@/lib/wallet-service";
// In a real app, you'd use a service to encrypt and save the key,
// and you would require user authentication.
// import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    // const { userId } = await req.json();
    // if (!userId) {
    //   return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    // }

    const wallet = createDepositWallet();

    // IMPORTANT: In a real production environment, you would ENCRYPT the
    // privateKey with a user-specific key or via a KMS before saving it
    // to your database. Never store raw private keys.
    //
    // const { firestore } = getFirebaseAdmin();
    // await firestore.collection('users').doc(userId).collection('wallets').doc('eth').set({
    //   address: wallet.address,
    //   encryptedPrivateKey: encrypt(wallet.privateKey), // Pseudocode for encryption
    // });

    console.log(`[API] Created deposit wallet: ${wallet.address}`);

    return NextResponse.json({
      address: wallet.address,
      // DO NOT return the private key in a real API response.
      // This is for demonstration purposes only.
      privateKey: wallet.privateKey,
    });
  } catch (err: any) {
    console.error("[API] Error creating wallet:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
