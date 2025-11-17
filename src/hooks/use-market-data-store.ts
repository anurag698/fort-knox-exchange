
'use client';

import { create } from 'zustand';
import type { RawOrder } from '@/lib/types';

export type Trade = {
  p: string; // price
  q: string; // quantity
  m: boolean; // is buyer maker
  T: number; // timestamp
  t: number; // tradeId
};

export type Ticker = {
  E: number; // Event time
  s: string; // Symbol
  c: string; // Last price
  p: string; // Price change
  P: string; // Price change percent
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
};

export type TickerData = {
  price: number;
  priceChangePercent: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
  eventTime: number;
};

interface MarketDataState {
  bids: RawOrder[];
  asks: RawOrder[];
  trades: Trade[];
  tickers: Record<string, TickerData>;
  isConnected: boolean;
  error: string | null;
  setDepth: (bids: RawOrder[], asks: RawOrder[]) => void;
  updateDepth: (bids: RawOrder[], asks: RawOrder[]) => void;
  addTrade: (trade: Trade) => void;
  updateTicker: (symbol: string, data: TickerData) => void;
  setConnectionStatus: (isConnected: boolean, error?: string | null) => void;
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
  bids: [],
  asks: [],
  trades: [],
  tickers: {},
  isConnected: false,
  error: null,
  setDepth: (bids, asks) => set({ bids, asks }),
  updateDepth: (newBids, newAsks) => set((state) => {
    // Simple update logic: replace for now.
    // A real implementation would merge based on price levels.
    const updatedBids = [...newBids, ...state.bids]
      .slice(0, 50)
      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));

    const updatedAsks = [...newAsks, ...state.asks]
      .slice(0, 50)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
      
    return { bids: updatedBids, asks: updatedAsks };
  }),
  addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades.slice(0, 49)] })),
  updateTicker: (symbol, data) => set(state => ({
    tickers: {
      ...state.tickers,
      [symbol.toLowerCase()]: data
    }
  })),
  setConnectionStatus: (isConnected, error = null) => set({ isConnected, error }),
}));
