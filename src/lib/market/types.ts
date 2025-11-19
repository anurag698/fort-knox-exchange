// ======================================================
// Market Types (Global Shared Types)
// ======================================================

export type MarketType = "internal" | "hybrid";

export interface MarketConfig {
  symbol: string;          // e.g. "BTCUSDT"
  base: string;            // e.g. "BTC"
  quote: string;           // e.g. "USDT"
  type: MarketType;        // internal | hybrid
  dataFeed: "mexc" | "engine";
  precision: {
    price: number;
    amount: number;
  };
}
