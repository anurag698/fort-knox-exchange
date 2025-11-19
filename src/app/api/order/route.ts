// ======================================================
// API: /api/order
// Handles placing buy/sell orders from UI
// ======================================================

import { NextResponse } from "next/server";
import { routeOrder } from "@/lib/engine/router";
import { Order } from "@/lib/engine/types";
import { debit, credit } from "@/lib/engine/wallets";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { userId, symbol, side, amount, price } = body;

    if (!userId || !symbol || !side || !amount) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const order: Order = {
      id: crypto.randomUUID(),
      userId,
      symbol: symbol.toUpperCase(),
      side,
      price: price ? Number(price) : undefined,
      amount: Number(amount),
      timestamp: Date.now(),
    };

    // ------------------------------------------------------
    // Debit user BEFORE routing (simple prototype)
    // Real system: handle this carefully
    // ------------------------------------------------------
    if (side === "buy") {
      debit(userId, "USDT", amount * (price ?? 1));
    } else {
      debit(userId, symbol.replace("USDT", ""), amount);
    }

    // ------------------------------------------------------
    // HYBRID ROUTING
    // ------------------------------------------------------
    const result = await routeOrder(order);

    // ------------------------------------------------------
    // Credit back based on fills
    // ------------------------------------------------------
    let filled = 0;
    if (result.fills) {
      result.fills.forEach((f: any) => {
        filled += f.amount;

        if (side === "buy") {
          credit(userId, symbol.replace("USDT", ""), f.amount);
        } else {
          credit(userId, "USDT", f.amount * f.price);
        }
      });
    }

    return NextResponse.json({
      status: "ok",
      filled,
      engine: result,
    });
  } catch (e) {
    console.error("ORDER API ERROR", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
