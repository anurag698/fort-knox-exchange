
// ======================================================
// ORDERBOOK STORE (Internal Engine + MEXC Depth)
// ======================================================

import { create } from "zustand";

type Level = { price: number; size: number };

interface OrderbookState {
  symbol: string | null;

  bids: Level[];
  asks: Level[];

  source: "internal" | "mexc" | "hybrid";

  setSymbol: (s: string) => void;
  setInternalDepth: (bids: Level[], asks: Level[]) => void;
  setMexcDepth: (bids: Level[], asks: Level[]) => void;
  clear: () => void;
}

export const useOrderbookStore = create<OrderbookState>((set, get) => ({
  symbol: null,
  bids: [],
  asks: [],
  source: "internal",

  setSymbol: (s) => set({ symbol: s }),

  setInternalDepth: (bids, asks) =>
    set({
      bids,
      asks,
      source: "internal",
    }),

  setMexcDepth: (bids, asks) =>
    set({
      bids,
      asks,
      source: "mexc",
    }),

  clear: () => set({ bids: [], asks: [] }),
}));
