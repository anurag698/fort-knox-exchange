import { NextResponse } from "next/server";
import { proposeErc20Transfer } from "@/lib/wallet-service";
import { ethers } from "ethers";

const DAILY_LIMIT = 200; // in USD or token units depending on your design

export async function POST(req: Request) {
  try {
    const { userId, amount, tokenAddress, to } = await req.json();

    // Basic validation
    if (!amount || !to || !tokenAddress) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Convert amount to BigInt
    const amountWei = ethers.parseUnits(amount.toString(), 6).toString(); // for USDT/USDC (6 decimals)

    // 1) SMALL withdrawal → direct from hot wallet
    if (amount <= DAILY_LIMIT) {
      return NextResponse.json({
        status: "AUTO_WITHDRAWAL",
        message: "Send directly from hot wallet",
      });
    }

    // 2) LARGE withdrawal → propose Safe TX
    const proposal = await proposeErc20Transfer(tokenAddress, to, amountWei);

    return NextResponse.json({
      status: "AWAITING_SIGNATURES",
      safeTxHash: proposal.safeTxHash,
      message: "Withdrawal proposed via Safe multisig. Needs 2 signatures.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
