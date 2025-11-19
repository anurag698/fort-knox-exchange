
// ======================================================
// TRADES STORE (Internal Fills Only)
// ======================================================

import { create } from "zustand";
import { Trade } from "@/lib/engine/types";

interface TradeStoreState {
  trades: Record<string, Trade[]>;

  pushTrade: (symbol: string, trade: Trade) => void;
  getTrades: (symbol: string) => Trade[];
  clear: (symbol: string) => void;
}

export const useTradesStore = create<TradeStoreState>((set, get) => ({
  trades: {},

  pushTrade: (symbol, trade) =>
    set((state) => {
      const arr = state.trades[symbol] ?? [];
      return {
        trades: {
          ...state.trades,
          [symbol]: [trade, ...arr].slice(0, 150), // store last 150
        },
      };
    }),

  getTrades: (symbol) => get().trades[symbol] ?? [],

  clear: (symbol) =>
    set((state) => ({
      trades: { ...state.trades, [symbol]: [] },
    })),
}));
