
// ======================================================
// MARKET DATA STORE (Unified MEXC + Engine Layer)
// ======================================================

import { create } from "zustand";
import { adaptDepth, adaptKline, adaptTicker, adaptTrades } from "@/services/data-adapter";

interface MarketDataState {
  symbol: string;
  isConnected: boolean;
  error: string | null;
  ticker: any;
  depth: { bids: any[]; asks: any[] };
  trades: any[];
  klines: any[];

  setSymbol: (s: string) => void;
  setTicker: (d: any) => void;
  setDepth: (bids: any[], asks: any[]) => void;
  pushTrade: (trade: any) => void;
  applyKline: (d: any) => void;
  setConnected: (status: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  symbol: "BTC-USDT",
  isConnected: false,
  error: null,
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
      isConnected: false,
      error: null,
    }),

  setTicker: (d) => set({ ticker: d }),
  
  pushTrade: (trade) => set((state) => ({
      trades: [trade, ...state.trades].slice(0, 100),
  })),

  setDepth: (bids, asks) => set({ depth: {bids, asks} }),

  applyKline: (k) =>
    set((state) => ({
      klines: [...state.klines, adaptKline(k)].slice(-500),
    })),
    
  setConnected: (status) => set({ isConnected: status }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      ticker: null,
      depth: { bids: [], asks: [] },
      trades: [],
      klines: [],
      isConnected: false,
      error: null,
    }),
}));

export const marketDataStore = useMarketDataStore;
