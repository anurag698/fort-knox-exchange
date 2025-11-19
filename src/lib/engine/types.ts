// ======================================================
// Internal Matching Engine: Shared Types
// ======================================================

export type Side = "buy" | "sell";

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  side: Side;
  price?: number; // undefined = market order
  amount: number;
  timestamp: number;
}

export interface OrderLevel {
  price: number;
  size: number;
}

export interface OrderbookState {
  bids: OrderLevel[];
  asks: OrderLevel[];
}

export interface MatchResult {
  fills: {
    price: number;
    amount: number;
  }[];
  remaining: number;
}

export interface Trade {
  id: string;
  symbol: string;
  price: number;
  amount: number;
  buyUser: string;
  sellUser: string;
  ts: number;
}
