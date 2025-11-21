import { NextResponse } from "next/server";
import { updateItem } from '@/lib/azure/cosmos-updates';

export async function POST(req: Request) {
  try {
    const { withdrawalId, userId } = await req.json();

    if (!withdrawalId || !userId) {
      return NextResponse.json({ error: "Missing withdrawalId or userId" }, { status: 400 });
    }

    // Update withdrawal status in Cosmos DB
    await updateItem('withdrawals', withdrawalId, userId, {
      status: "approved",
      approvedAt: new Date().toISOString()
    });

    return NextResponse.json({ status: "approved" });

  } catch (e: any) {
    console.error('Withdrawal approval error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
