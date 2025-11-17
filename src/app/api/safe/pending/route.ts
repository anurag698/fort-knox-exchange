import { NextResponse } from "next/server";
import { getPendingTransactions } from "@/lib/wallet-service";

export async function GET() {
  try {
    const pending = await getPendingTransactions(50, 0);

    return NextResponse.json({
      txs: pending.results || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
