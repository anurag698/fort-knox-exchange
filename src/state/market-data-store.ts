
import { create } from "zustand";
import { bus } from "@/components/bus";
import { RawOrder } from "@/lib/types";

interface MarketDataState {
  symbol: string;
  isConnected: boolean;
  error: string | null;
  ticker: { price: number; change: number, s: string, high: number, low: number, volume: number } | null;
  bids: RawOrder[];
  asks: RawOrder[];
  trades: any[];
  
  setConnected: (status: boolean) => void;
  setError: (error: string | null) => void;
  pushTrade: (trade: any) => void;
  setDepth: (bids: RawOrder[], asks: RawOrder[]) => void;
  setTicker: (ticker: any) => void;
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
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
}));

// Listen to global bus events and update the store
bus.on("ticker", (data) => {
  const ticker = {
    price: parseFloat(data.a),
    change: parseFloat(data.P),
    s: data.s,
    high: parseFloat(data.h),
    low: parseFloat(data.l),
    volume: parseFloat(data.v),
  };
  useMarketDataStore.getState().setTicker(ticker);
});

bus.on("depth", (data) => {
  useMarketDataStore.getState().setDepth(data.bids, data.asks);
});

bus.on("trade", (data) => {
  const trade = {
    p: data.p,
    q: data.v,
    T: data.t,
    m: data.S === "buy",
  };
  useMarketDataStore.getState().pushTrade(trade);
});
