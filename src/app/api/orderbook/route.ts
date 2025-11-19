// ======================================================
// API: /api/orderbook
// Returns internal orderbook state
// ======================================================

import { NextResponse } from "next/server";
import { getOrderbook } from "@/lib/engine/orderbook";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "SYMBOL_REQUIRED" }, { status: 400 });
  }

  const book = getOrderbook(symbol.toUpperCase());

  return NextResponse.json({
    symbol,
    bids: book.bids,
    asks: book.asks,
  });
}
