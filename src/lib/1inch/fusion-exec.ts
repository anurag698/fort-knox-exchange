// ======================================================
// Execute Order via 1inch Fusion
// ======================================================

import { resolveToken } from "./helpers";

export async function executeFusionOrder({
  symbol,
  side,
  amount,
  userId,
}: {
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  userId: string;
}) {
  try {
    const base = symbol.replace("USDT", "");
    const src = side === "buy" ? "USDT" : base;
    const dst = side === "buy" ? base : "USDT";

    const srcAddr = resolveToken(src);
    const dstAddr = resolveToken(dst);

    if (!srcAddr || !dstAddr) {
      return { success: false, reason: "TOKEN_NOT_SUPPORTED" };
    }

    const quoteUrl = `https://api.1inch.dev/fusion/quoter/v1.2/56/quote?fromTokenAddress=${srcAddr}&toTokenAddress=${dstAddr}&amount=${amount}`;

    const quoteRes = await fetch(quoteUrl, {
      headers: {
        "Authorization": "Bearer " + process.env.ONEINCH_API_KEY,
      },
    });

    if (!quoteRes.ok) {
      return { success: false, reason: "NO_FUSION_LIQUIDITY" };
    }

    const quote = await quoteRes.json();

    // For now we simulate execution success (Fort Knox internal testnet)
    return {
      success: true,
      price: parseFloat(quote.toAmount) / amount,
      amount,
      via: "1inch-fusion",
    };

  } catch (e) {
    console.error("Fusion exec error:", e);
    return { success: false, reason: "FUSION_ERROR" };
  }
}
