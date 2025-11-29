import { NextResponse } from "next/server";
import { upsertItem } from '@/lib/azure/cosmos';
import { Withdrawal } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { userId, address, amount, token } = await req.json();

    if (!userId || !address || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const withdrawalId = `withdrawal-${userId}-${Date.now()}`;

    // Create withdrawal request in Cosmos DB
    // Create withdrawal request in Cosmos DB
    const withdrawal: Withdrawal = {
      id: withdrawalId,
      userId,
      withdrawalAddress: address,
      amount,
      assetId: token ?? "ETH",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: undefined,
      transactionHash: undefined
    };

    await upsertItem<Withdrawal>('withdrawals', withdrawal);

    return NextResponse.json({
      status: "success",
      withdrawalId
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
