
export type SymbolId = string; // e.g. BTCUSDT (no dash)

export type Candle = {
  // normalized candle used across the app
  // time is ms epoch
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  final?: boolean;
};

export type Trade = {
  id?: string | number;
  p: number; // price
  q: number; // quantity / size
  ts: number; // timestamp ms
  side: "buy" | "sell";
};

export type DepthLevel = { price: number; size: number };
export type Depth = { bids: DepthLevel[]; asks: DepthLevel[]; ts?: number; mid?: number };

export type Ticker = {
  symbol: SymbolId;
  bidPrice?: number;
  askPrice?: number;
  lastPrice?: number;
  open?: number;
  high?: number;
  low?: number;
  vol?: number;
  volume?: number;
  ts?: number;
  price?: number;
  change?: number;
  changePercent?: number;
};

// helpers
export const parseNumber = (v: any): number => {
  if (v === undefined || v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
