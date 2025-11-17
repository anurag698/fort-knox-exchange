import { NextResponse } from "next/server";
import { proposeErc20Transfer } from "@/lib/wallet-service";
import { ethers } from "ethers";
import { hotWalletWithdraw } from "@/services/hot-withdraw";

const DAILY_LIMIT = 200; // in USD or token units depending on your design

export async function POST(req: Request) {
  try {
    const { userId, amount, tokenAddress, to } = await req.json();

    // Basic validation
    if (!amount || !to || !tokenAddress) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1) SMALL withdrawal → direct from hot wallet
    if (amount <= DAILY_LIMIT) {
      const result = await hotWalletWithdraw(tokenAddress, to, amount);

      return NextResponse.json({
        status: result.status,
        txHash: result.txHash || null,
        message: result.status === 'SUCCESS' ? "Withdrawal completed via hot wallet" : result.error,
      });
    }

    // 2) LARGE withdrawal → propose Safe TX
    // Convert amount to BigInt for Safe proposal (assuming 6 decimals for this path)
    const amountWei = ethers.parseUnits(amount.toString(), 6).toString();
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
