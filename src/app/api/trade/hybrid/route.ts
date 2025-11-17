
import { NextResponse } from "next/server";
import { routeOrder } from "@/services/trading/hybrid-router";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { ethers } from "ethers";

/**
 * HYBRID ORDER API
 * Supports:
 * - BUY / SELL Orders
 * - CEX Matching (Orderbook)
 * - DEX Aggregator Execution
 * - Hybrid (Split Routing, Auto Decision)
 */
export async function POST(req: Request) {
  const { firestore, FieldValue } = getFirebaseAdmin();
  
  try {
    const { userId, marketId, side, amount, chainId, fromToken, toToken } =
      await req.json();

    if (!userId || !marketId || !side || !amount || !fromToken || !toToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔍 Convert amount to number
    const tradeAmount = Number(amount);
    if (tradeAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    /**
     * STEP 1 — Check user balance
     */
    const balanceRef = firestore.collection("users").doc(userId).collection("balances").doc(fromToken);
    const balanceSnap = await balanceRef.get();

    const userBalance = balanceSnap.exists
      ? balanceSnap.data()?.available ?? 0
      : 0;

    if (tradeAmount > Number(userBalance)) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    /**
     * STEP 2 — Route trade (CEX / DEX / Hybrid)
     */
    const execution = await routeOrder({
      userId,
      marketId,
      side,
      quantity: tradeAmount,
      chainId: chainId ?? 137,
      fromToken, // These should be contract addresses for the router
      toToken,
    });

    /**
     * STEP 3 — Handle DEX Aggregator execution result
     */
    if (execution.engine === "DEX_AGGREGATOR") {
      const result = execution.trade;

      const amountOut = Number(
        ethers.formatUnits(result.amountOut, 18) // Assuming 18 decimals, in real app fetch from DB
      );
      
      const batch = firestore.batch();

      // Deduct sold amount
      const fromBalanceRef = firestore.collection('users').doc(userId).collection('balances').doc(fromToken);
      batch.update(fromBalanceRef, { available: FieldValue.increment(-tradeAmount) });

      // Add bought amount
      const toBalanceRef = firestore.collection('users').doc(userId).collection('balances').doc(toToken);
      batch.set(toBalanceRef, { available: FieldValue.increment(amountOut) }, { merge: true });

      // Save trade history
      const historyRef = firestore.collection("users").doc(userId).collection("tradeHistory").doc();
       batch.set(historyRef, {
          engine: "DEX_AGGREGATOR",
          side,
          marketId,
          fromToken,
          toToken,
          amountIn: tradeAmount,
          amountOut,
          txHash: result.txHash,
          price: result.price,
          createdAt: FieldValue.serverTimestamp(),
        });
        
      await batch.commit();

      return NextResponse.json(
        {
          engine: "DEX_AGGREGATOR",
          result: {
            txHash: result.txHash,
            amountOut,
            amountIn: tradeAmount,
            price: result.price,
          },
        },
        { status: 200 }
      );
    }

    /**
     * STEP 4 — Handle internal orderbook execution result
     */
    if (execution.engine === "CEX_ORDERBOOK") {
      // The order is already placed and potentially matched by the orderbook engine.
      // Balance updates are handled within the settlement logic of the matching engine.
      return NextResponse.json(
        {
          engine: "CEX_ORDERBOOK",
          order: execution.order,
          message: "Order placed in orderbook. Matching engine will fill it.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Unknown execution engine" },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("HYBRID API ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
