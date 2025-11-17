// src/app/api/wallet/balance/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getEthBalance } from "@/lib/wallet-service";
import { z } from "zod";

const balanceSchema = z.object({
  address: z.string().startsWith("0x"),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const validation = balanceSchema.safeParse({
    address: searchParams.get("address"),
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const balance = await getEthBalance(validation.data.address);
    return NextResponse.json({ address: validation.data.address, balance });
  } catch (err: any) {
    console.error("[API] Error fetching balance:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
