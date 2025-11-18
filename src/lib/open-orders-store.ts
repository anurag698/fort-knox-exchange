
"use client";

import { create } from "zustand";
import { HybridOrderRequest } from "./order-types";

export interface OpenOrder {
  id: string;               // order ID (DB or client)
  marketId: string;
  side: "BUY" | "SELL";
  type: string;
  quantity: number;
  price: number | null;
  triggerPrice: number | null;
  parentOcoId?: string | null;
  status: "OPEN" | "FILLED" | "CANCELED";
  timestamp: number;
}

interface OpenOrdersState {
  orders: OpenOrder[];

  addOrder: (o: OpenOrder) => void;
  updateOrder: (id: string, updates: Partial<OpenOrder>) => void;
  removeOrder: (id: string) => void;
  clearMarket: (marketId: string) => void;

  getOrdersByMarket: (marketId: string) => OpenOrder[];
  getOverlayOrders: (marketId: string) => OpenOrder[];
}

export const useOpenOrdersStore = create<OpenOrdersState>((set, get) => ({
  orders: [],

  addOrder: (o) =>
    set((s) => ({
      orders: [...s.orders, o],
    })),

  updateOrder: (id, updates) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),

  removeOrder: (id) =>
    set((s) => ({
      orders: s.orders.filter((o) => o.id !== id),
    })),

  clearMarket: (marketId) =>
    set((s) => ({
      orders: s.orders.filter((o) => o.marketId !== marketId),
    })),

  getOrdersByMarket: (marketId) => {
    return get().orders.filter((o) => o.marketId === marketId);
  },

  getOverlayOrders: (marketId) => {
    // Only show LIMIT, STOP-LIMIT, STOP-MARKET, TP, TP-LIMIT, TRAILING
    return get().orders.filter((o) => {
      return (
        o.marketId === marketId &&
        [
          "LIMIT",
          "STOP_LIMIT",
          "STOP_MARKET",
          "TAKE_PROFIT_MARKET",
          "TAKE_PROFIT_LIMIT",
          "TRAILING_STOP",
        ].includes(o.type)
      );
    });
  },
}));
