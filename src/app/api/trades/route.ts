// ======================================================
// API: /api/trades
// Returns recent internal trades (trade history)
// ======================================================

import { NextResponse } from "next/server";
import { internalTrades } from "@/state/internal-trades-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "SYMBOL_REQUIRED" }, { status: 400 });
  }

  const trades = internalTrades[symbol] ?? [];

  return NextResponse.json({ trades });
}
