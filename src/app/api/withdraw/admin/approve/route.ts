
import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { withdrawalId } = await req.json();
    const { firestore } = getFirebaseAdmin()!;

    const ref = firestore.collection("withdrawals").doc(withdrawalId);
    await ref.update({
      status: "approved",
      approvedAt: new Date()
    });

    return NextResponse.json({ status: "approved" });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
