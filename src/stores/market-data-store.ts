
"use client";

import { create } from "zustand";

export const useMarketDataStore = create((set) => ({
  marketList: [],
  tickers: {},

  setMarketList: (list) => set({ marketList: list }),

  updateTicker: (symbol, data) =>
    set((s) => ({
      tickers: {
        ...s.tickers,
        [symbol]: data,
      },
    })),
}));
