import { NextResponse } from "next/server";
import { upsertItem } from '@/lib/azure/cosmos';

export async function POST(req: Request) {
  try {
    const { userId, address, amount, token } = await req.json();

    if (!userId || !address || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const withdrawalId = `withdrawal-${userId}-${Date.now()}`;

    // Create withdrawal request in Cosmos DB
    const withdrawal = {
      id: withdrawalId,
      userId,
      address,
      amount,
      token: token ?? "ETH",
      status: "pending",
      createdAt: new Date().toISOString(),
      approvedAt: null,
      txHash: null
    };

    await upsertItem('withdrawals', withdrawal, userId);

    return NextResponse.json({
      status: "success",
      withdrawalId
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
