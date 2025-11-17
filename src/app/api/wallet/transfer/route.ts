// src/app/api/wallet/transfer/route.ts
import { NextResponse } from "next/server";
import { transferEth, transferToken } from "@/lib/wallet-service";
import { ethers } from "ethers";

export async function POST(req: Request) {
  try {
    const { to, amount, tokenAddress } = await req.json();

    if (!to || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: to, amount" },
        { status: 400 }
      );
    }

    let txReceipt;

    if (tokenAddress) {
      // This is an ERC20 transfer
      // Note: The amount for ERC20 transfers should be in the token's smallest unit (wei).
      // You would typically get the token's decimals from your database.
      // For this example, we assume 18 decimals.
      const amountWei = ethers.parseUnits(amount, 18);
      txReceipt = await transferToken(tokenAddress, to, amountWei.toString());
    } else {
      // This is a native ETH transfer
      txReceipt = await transferEth(to, amount);
    }

    return NextResponse.json({
      status: "SUCCESS",
      transactionHash: txReceipt?.hash,
    });
  } catch (err: any) {
    console.error("[API] Error processing transfer:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
