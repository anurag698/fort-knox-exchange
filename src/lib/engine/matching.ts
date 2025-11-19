// ======================================================
// Internal Matching Engine: Matching Logic
// ======================================================

import { Order, MatchResult, Side, Trade } from "./types";
import { getOrderbook, reduceLevel } from "./orderbook";
import { emitTrade } from "./trade-events";

export function matchOrder(order: Order): MatchResult {
  const book = getOrderbook(order.symbol);
  const fills: MatchResult["fills"] = [];
  let remaining = order.amount;

  const side: Side = order.side;
  const levels = side === "buy" ? book.asks : book.bids;

  for (let i = 0; i < levels.length && remaining > 0; i++) {
    const lvl = levels[i];

    // Limit order price check
    if (order.price !== undefined) {
      if (side === "buy" && lvl.price > order.price) break;
      if (side === "sell" && lvl.price < order.price) break;
    }

    const fillAmt = Math.min(remaining, lvl.size);

    fills.push({ price: lvl.price, amount: fillAmt });

    // Emit trade event
    emitTrade({
      id: crypto.randomUUID(),
      symbol: order.symbol,
      price: lvl.price,
      amount: fillAmt,
      buyUser: side === "buy" ? order.userId : "maker",
      sellUser: side === "sell" ? order.userId : "maker",
      ts: Date.now(),
    });

    remaining -= fillAmt;
    reduceLevel(levels, i, fillAmt);
    i--; // because element might be removed
  }

  return { fills, remaining };
}
