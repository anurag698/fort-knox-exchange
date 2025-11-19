// ======================================================
// Internal Matching Engine: Orderbook
// ======================================================

import { OrderbookState, OrderLevel } from "./types";

const books: Record<string, OrderbookState> = {};

export function getOrderbook(symbol: string): OrderbookState {
  if (!books[symbol]) {
    books[symbol] = { bids: [], asks: [] };
  }
  return books[symbol];
}

function insertLevel(levels: OrderLevel[], price: number, amount: number, side: "buy" | "sell") {
  if (amount <= 0) return;

  const existing = levels.find((l) => l.price === price);
  if (existing) {
    existing.size += amount;
    return;
  }

  levels.push({ price, size: amount });

  // Sort
  if (side === "buy") {
    levels.sort((a, b) => b.price - a.price); // highest first
  } else {
    levels.sort((a, b) => a.price - b.price); // lowest first
  }
}

export function addToOrderbook(symbol: string, side: "buy" | "sell", price: number, amount: number) {
  const book = getOrderbook(symbol);

  if (side === "buy") {
    insertLevel(book.bids, price, amount, "buy");
  } else {
    insertLevel(book.asks, price, amount, "sell");
  }
}

export function reduceLevel(levels: OrderLevel[], index: number, amount: number) {
  levels[index].size -= amount;
  if (levels[index].size <= 0) {
    levels.splice(index, 1);
  }
}
