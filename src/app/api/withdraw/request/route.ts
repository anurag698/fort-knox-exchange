
import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { userId, address, amount, token } = await req.json();
    const { firestore } = getFirebaseAdmin()!;

    if (!userId || !address || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Create request in queue
    const ref = await firestore.collection("withdrawals").add({
      userId,
      address,
      amount,
      token: token ?? "ETH",
      status: "pending",
      createdAt: new Date(),
      approvedAt: null,
      txHash: null
    });

    return NextResponse.json({
      status: "success",
      withdrawalId: ref.id
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
