import { create } from "zustand";
import { bus } from "@/components/bus";

export interface Kline {
  t: number;   // timestamp
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  final?: boolean;
}

export interface DepthLevel {
  price: number;
  size: number;
}

export interface DepthData {
  bids: DepthLevel[];
  asks: DepthLevel[];
  mid?: number;
}

export interface Trade {
  p: number;   // price
  q: number;   // quantity
  S: "buy" | "sell"; // side
  t: number;   // timestamp
}

export interface MarketState {
  symbol: string;      // BTCUSDT
  interval: string;    // 1m

  // Real-time state
  lastKline: Kline | null;
  depth: DepthData | null;
  trades: Trade[];
  ticker: any | null;

  // Setters
  setSymbol: (s: string) => void;
  setInterval: (i: string) => void;

  // Stream controllers
  pushKline: (k: Kline) => void;
  pushDepth: (d: DepthData) => void;
  pushTrade: (t: Trade) => void;
  pushTicker: (t: any) => void;

  clearTrades: () => void;
}

export const useMarketDataStore = create<MarketState>((set, get) => ({
  symbol: "BTCUSDT",
  interval: "1m",

  lastKline: null,
  depth: null,
  trades: [],
  ticker: null,

  setSymbol: (symbol) =>
    set({
      symbol,
      trades: [],
      depth: null,
      lastKline: null,
    }),

  setInterval: (interval) =>
    set({
      interval,
      lastKline: null,
    }),

  // -----------------------------
  //  LIVE KLINE
  // -----------------------------
  pushKline: (k) => {
    set({ lastKline: k });

    // Forward to event bus for chart overlays, indicators, drawings
    bus.emit("kline", k);
  },

  // -----------------------------
  //  DEPTH
  // -----------------------------
  pushDepth: (d) => {
    set({ depth: d });

    bus.emit("depth", d);
  },

  // -----------------------------
  //  TRADE FEED
  // -----------------------------
  pushTrade: (t) => {
    const list = get().trades;

    const newList =
      list.length < 50 ? [...list, t] : [...list.slice(1), t];

    set({ trades: newList });

    bus.emit("trade", t);
  },

  // -----------------------------
  //  TICKER / PNL FEED
  // -----------------------------
  pushTicker: (t) => {
    set({ ticker: t });

    bus.emit("ticker", t);
  },

  clearTrades: () => set({ trades: [] }),
}));
