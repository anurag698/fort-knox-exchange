
// src/app/api/wallet/create/route.ts
import { NextResponse } from "next/server";
import { createDepositWallet, saveUserWallet } from "@/lib/wallet-service";
// In a real app, you'd use a service to encrypt and save the key,
// and you would require user authentication.
// import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const wallet = createDepositWallet();
    await saveUserWallet(userId, wallet);


    console.log(`[API] Created deposit wallet: ${wallet.address}`);

    return NextResponse.json({
      address: wallet.address
    });
  } catch (err: any) {
    console.error("[API] Error creating wallet:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

