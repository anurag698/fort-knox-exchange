"use client";

import { create } from "zustand";

export const useMarketDataStore = create((set) => ({
  marketList: [],
  tickers: {},
  trades: [],

  setMarketList: (list) => set({ marketList: list }),

  updateTicker: (symbol, data) =>
    set((s) => ({
      tickers: {
        ...s.tickers,
        [symbol]: data,
      },
    })),
  
  pushTrade: (trade) =>
    set((state) => ({
      trades: [trade, ...state.trades].slice(0, 100),
    })),
}));
