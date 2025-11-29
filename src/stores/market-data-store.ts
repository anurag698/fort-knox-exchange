"use client";

import { create } from "zustand";

export const useMarketDataStore = create((set) => ({
  marketList: [] as any[],
  tickers: {} as Record<string, any>,
  trades: [] as any[],

  setMarketList: (list: any[]) => set({ marketList: list }),

  updateTicker: (symbol: string, data: any) =>
    set((s: any) => ({
      tickers: {
        ...s.tickers,
        [symbol]: data,
      },
    })),

  pushTrade: (trade: any) =>
    set((state: any) => ({
      trades: [trade, ...state.trades].slice(0, 100),
    })),
}));
