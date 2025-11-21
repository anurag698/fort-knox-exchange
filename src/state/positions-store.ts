// POSITIONS STORE (Multi-entry + Weighted Average)

import { create } from "zustand";

interface Position {
  symbol: string;
  side: "long" | "short";
  entries: { price: number; amount: number }[];
  totalAmount: number;
  avgPrice: number;
  unrealizedPnl: number;
}

interface PosState {
  positions: Record<string, Position>;
  addEntry: (userId: string, symbol: string, side: "long" | "short", price: number, amount: number) => void;
  updateUnrealized: (symbol: string, lastPrice: number) => void;
  clear: () => void;
}

export const usePositionsStore = create<PosState>((set, get) => ({
  positions: {},
  addEntry: (userId, symbol, side, price, amount) =>
    set((state) => {
      const p = state.positions[symbol];
      if (!p) {
        return {
          positions: {
            ...state.positions,
            [symbol]: {
              symbol,
              side,
              entries: [{ price, amount }],
              totalAmount: amount,
              avgPrice: price,
              unrealizedPnl: 0,
            },
          },
        };
      }
      const newTotal = p.totalAmount + amount;
      const newAvg = (p.avgPrice * p.totalAmount + price * amount) / newTotal;
      return {
        positions: {
          ...state.positions,
          [symbol]: {
            ...p,
            entries: [...p.entries, { price, amount }],
            totalAmount: newTotal,
            avgPrice: newAvg,
          },
        },
      };
    }),
  updateUnrealized: (symbol, lastPrice) =>
    set((state) => {
      const p = state.positions[symbol];
      if (!p) return state;
      const pnl = p.side === "long"
        ? (lastPrice - p.avgPrice) * p.totalAmount
        : (p.avgPrice - lastPrice) * p.totalAmount;
      return {
        positions: {
          ...state.positions,
          [symbol]: { ...p, unrealizedPnl: pnl },
        },
      };
    }),
  clear: () => set({ positions: {} }),
}));

// Simple in‑memory export for API routes that need direct access
export const positionsDB: Record<string, any> = {};
