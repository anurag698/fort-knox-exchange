// ======================================================
// HYBRID EXECUTION ROUTER
// Internal Matching Engine + 1inch Fusion (BNB Chain)
// ======================================================

import { Order } from "./types";
import { matchOrder } from "./matching";
import { addToOrderbook } from "./orderbook";
import { executeFusionOrder } from "@/lib/1inch/fusion-exec";
import { getMarket } from "@/lib/market/market-config";

export async function routeOrder(order: Order) {
  const market = getMarket(order.symbol);

  if (!market) {
    return { status: "error", reason: "UNKNOWN_PAIR" };
  }

  // -------------------------------------------
  // 1. NOMOX → internal-only execution ALWAYS
  // -------------------------------------------
  if (order.symbol === "NOMOXUSDT") {
    const internal = matchOrder(order);

    // Any unfilled amount becomes maker order
    if (internal.remaining > 0 && order.price) {
      addToOrderbook(order.symbol, order.side, order.price, internal.remaining);
    }

    return {
      status: "ok",
      type: "internal",
      fills: internal.fills,
      remaining: internal.remaining,
    };
  }

  // -------------------------------------------
  // 2. Hybrid Pairs (Default)
  // -------------------------------------------
  const internalFill = matchOrder(order);

  if (internalFill.fills.length > 0 && internalFill.remaining <= 0) {
    // full internal fill
    return {
      status: "ok",
      type: "internal",
      fills: internalFill.fills,
      remaining: 0,
    };
  }

  // -------------------------------------------
  // 3. Partial or zero internal fill → fallback to 1inch Fusion
  // -------------------------------------------
  if (internalFill.remaining > 0) {
    const amountToRoute = internalFill.remaining;

    const fusionResult = await executeFusionOrder({
      symbol: order.symbol,
      side: order.side,
      amount: amountToRoute,
      userId: order.userId,
    });

    if (fusionResult.success) {
      return {
        status: "ok",
        type: "hybrid",
        internalFills: internalFill.fills,
        fusionFill: fusionResult,
        remaining: 0,
      };
    }

    // Liquidity still insufficient → maker order
    if (order.price) {
      addToOrderbook(order.symbol, order.side, order.price, internalFill.remaining);
    }

    return {
      status: "ok",
      type: "internal-maker",
      fills: internalFill.fills,
      remaining: internalFill.remaining,
    };
  }

  // fallback
  return {
    status: "ok",
    fills: internalFill.fills,
    remaining: internalFill.remaining,
  };
}
