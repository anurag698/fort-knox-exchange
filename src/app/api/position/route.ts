// ======================================================
// API: /api/position
// Returns user's open positions
// ======================================================

import { NextResponse } from "next/server";
import { positionsDB } from "@/state/positions-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "USER_REQUIRED" }, { status: 400 });
  }

  return NextResponse.json({
    positions: positionsDB[userId] ?? [],
  });
}
