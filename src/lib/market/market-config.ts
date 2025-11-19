// ======================================================
// Market Configuration for Fort Knox Exchange
// ======================================================

import { MarketConfig } from "./types";

export const MARKETS: MarketConfig[] = [
  // ------------------------------
  // Native Token — Internal Only
  // ------------------------------
  {
    symbol: "NOMOXUSDT",
    base: "NOMOX",
    quote: "USDT",
    type: "internal",       // executes ONLY on your internal engine
    dataFeed: "mexc",       // chart + ticker from MEXC
    precision: { price: 6, amount: 2 },
  },

  // ------------------------------
  // POL (BNB Chain)
  // ------------------------------
  {
    symbol: "POLUSDT",
    base: "POL",
    quote: "USDT",
    type: "hybrid",         // internal + fallback to 1inch
    dataFeed: "mexc",
    precision: { price: 5, amount: 2 },
  },

  // ------------------------------
  // Standard Top Pairs
  // ------------------------------
  {
    symbol: "BTCUSDT",
    base: "BTC",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 2, amount: 6 },
  },
  {
    symbol: "ETHUSDT",
    base: "ETH",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 2, amount: 5 },
  },
  {
    symbol: "BNBUSDT",
    base: "BNB",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 3, amount: 3 },
  },
  {
    symbol: "SOLUSDT",
    base: "SOL",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 3, amount: 2 },
  },
  {
    symbol: "XRPUSDT",
    base: "XRP",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 4, amount: 0 },
  },
  {
    symbol: "DOGEUSDT",
    base: "DOGE",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 5, amount: 0 },
  },
  {
    symbol: "ADAUSDT",
    base: "ADA",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 5, amount: 0 },
  },
  {
    symbol: "TRXUSDT",
    base: "TRX",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 5, amount: 0 },
  },
  {
    symbol: "LTCUSDT",
    base: "LTC",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 2, amount: 4 },
  },
  {
    symbol: "DOTUSDT",
    base: "DOT",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 4, amount: 2 },
  },
  {
    symbol: "LINKUSDT",
    base: "LINK",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 4, amount: 3 },
  },
  {
    symbol: "MATICUSDT",
    base: "MATIC",
    quote: "USDT",
    type: "hybrid",
    dataFeed: "mexc",
    precision: { price: 5, amount: 1 },
  },
];

export function getMarket(symbol: string): MarketConfig | undefined {
  return MARKETS.find((m) => m.symbol === symbol.toUpperCase());
}
