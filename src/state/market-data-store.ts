
"use client";

import { create } from "zustand";
import { bus } from "@/components/bus";
import { RawOrder, ProcessedOrder, MarketData } from "@/lib/types";

interface MarketDataState {
  symbol: string;
  isConnected: boolean;
  error: string | null;
  ticker: MarketData | null;
  bids: RawOrder[];
  asks: RawOrder[];
  trades: any[];
}

interface MarketDataActions {
  setConnected: (status: boolean) => void;
  setError: (error: string | null) => void;
  pushTrade: (trade: any) => void;
  setDepth: (bids: RawOrder[], asks: RawOrder[]) => void;
  setTicker: (ticker: any) => void;
  setSymbol: (symbol: string) => void;
}

export const useMarketDataStore = create<MarketDataState & MarketDataActions>((set) => ({
  symbol: "BTC-USDT",
  isConnected: false,
  error: null,
  ticker: null,
  bids: [],
  asks: [],
  trades: [],
  
  setConnected: (status) => set({ isConnected: status }),
  setError: (error) => set({ error }),
  pushTrade: (trade) => set((state) => ({
      trades: [trade, ...state.trades].slice(0, 100),
  })),
  setDepth: (bids, asks) => set({ bids, asks }),
  setTicker: (ticker) => set({ ticker }),
  setSymbol: (symbol) => set({ symbol }),
}));

// Listen to global bus events and update the store
bus.on("ticker", (data) => {
  const ticker = {
    id: data.s,
    price: parseFloat(data.a || data.askPrice || data.c),
    priceChangePercent: parseFloat(data.P),
    high: parseFloat(data.h),
    low: parseFloat(data.l),
    volume: parseFloat(data.v),
    marketCap: 0,
    lastUpdated: new Date()
  };
  useMarketDataStore.getState().setTicker(ticker);
});

bus.on("depth", (data) => {
  if (data?.bids && data?.asks) {
    useMarketDataStore.getState().setDepth(data.bids, data.asks);
  }
});

bus.on("trade", (data) => {
  const trade = {
    price: parseFloat(data.p),
    quantity: parseFloat(data.v),
    timestamp: data.t,
    side: data.S === "buy" ? "BUY" : "SELL",
  };
  useMarketDataStore.getState().pushTrade(trade);
});

bus.on("kline", (candle) => {
  // The chart engine consumes kline events directly.
  // We can update the ticker here as a fallback if the dedicated ticker stream fails.
  const state = useMarketDataStore.getState();
  if (!state.ticker || state.ticker.id === candle.s) {
    useMarketDataStore.getState().setTicker({
      ...state.ticker,
      id: candle.s,
      price: candle.c,
      priceChangePercent: state.ticker?.priceChangePercent || 0,
      high: Math.max(state.ticker?.high || 0, candle.h),
      low: Math.min(state.ticker?.low || Infinity, candle.l),
      volume: (state.ticker?.volume || 0) + candle.v,
      lastUpdated: new Date(candle.t),
    });
  }
});

bus.on("market-feed:status", (data: any) => {
    if (data.status === 'offline') {
        useMarketDataStore.getState().setConnected(false);
    } else {
        useMarketDataStore.getState().setConnected(true);
    }
     if (data.error) {
        useMarketDataStore.getState().setError(data.error);
    } else {
        useMarketDataStore.getState().setError(null);
    }
});
