
// ======================================================
// MARKET DATA STORE (Unified MEXC + Engine Layer)
// ======================================================

import { create } from "zustand";
import { adaptDepth, adaptKline, adaptTicker, adaptTrades } from "@/services/data-adapter";

interface MarketDataState {
  symbol: string;

  ticker: any;
  depth: { bids: any[]; asks: any[] };
  trades: any[];
  klines: any[];

  setSymbol: (s: string) => void;

  applyTicker: (d: any) => void;
  applyDepth: (d: any) => void;
  applyTrades: (arr: any[]) => void;
  applyKline: (d: any) => void;

  reset: () => void;
}

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  symbol: "BTCUSDT",

  ticker: null,
  depth: { bids: [], asks: [] },
  trades: [],
  klines: [],

  setSymbol: (s) =>
    set({
      symbol: s,
      depth: { bids: [], asks: [] },
      trades: [],
      klines: [],
      ticker: null,
    }),

  applyTicker: (d) => set({ ticker: adaptTicker(d) }),

  applyDepth: (d) =>
    set({
      depth: adaptDepth(d),
    }),

  applyTrades: (arr) =>
    set({
      trades: adaptTrades(arr),
    }),

  applyKline: (k) =>
    set((state) => ({
      klines: [...state.klines, adaptKline(k)].slice(-500),
    })),

  reset: () =>
    set({
      ticker: null,
      depth: { bids: [], asks: [] },
      trades: [],
      klines: [],
    }),
}));
