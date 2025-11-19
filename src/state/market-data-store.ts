"use client";

import { create } from "zustand";

export type ProcessedOrder = {
  price: number;
  size: number;
  isWall: boolean;
};

export type TickerData = {
  price: number;
  change: number;
  high: number;
  low: number;
  volume: number;
};

interface MarketDataState {
  ticker: TickerData | null;
  bids: ProcessedOrder[];
  asks: ProcessedOrder[];
  trades: any[];
  isConnected: boolean;
  error: string | null;

  setTicker: (data: TickerData) => void;
  setDepth: (bids?: any[], asks?: any[]) => void;
  pushTrade: (data: any) => void;
  setConnected: (v: boolean) => void;
  setError: (s: string | null) => void;
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
  ticker: null,
  bids: [],
  asks: [],
  trades: [],
  isConnected: false,
  error: null,

  setTicker: (data) => set({ ticker: data }),

  setDepth: (bids, asks) => {
    if (!Array.isArray(bids) || !Array.isArray(asks))
      return set({ bids: [], asks: [] });

    const detectWalls = (lvls: any[]) => {
      if (!lvls.length) return [];

      const top = lvls.slice(0, 20);
      const avg = top.reduce((acc, lvl) => acc + Number(lvl[1] || 0), 0) / top.length;
      const wall = avg * 3;

      return lvls.map((lvl) => ({
        price: Number(lvl[0] || 0),
        size: Number(lvl[1] || 0),
        isWall: Number(lvl[1] || 0) >= wall,
      }));
    };

    set({
      bids: detectWalls(bids),
      asks: detectWalls(asks),
    });
  },

  pushTrade: (t) =>
    set((s) => ({
      trades: [t, ...s.trades].slice(0, 120),
    })),

  setConnected: (v) => set({ isConnected: v }),
  setError: (s) => set({ error: s }),
}));
