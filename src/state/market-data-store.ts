// src/state/market-data-store.ts
"use client";

import { create } from "zustand";
import { produce } from "immer";
import type { Candle, Trade, Depth, Ticker } from "@/lib/market-types";

/**
 * Unified high-performance market data store for the Pro Trading UI.
 *
 * Shapes:
 *  - kline: Record<SymbolId, Candle[]>
 *  - trades: Record<SymbolId, Trade[]>
 *  - depth: Record<SymbolId, Depth>
 *  - ticker: Record<SymbolId, Ticker>
 *
 * Methods exposed (used by market-data-subscriber):
 *  - setKline(symbol, candle)
 *  - pushTrade(symbol, trade)
 *  - setDepth(symbol, depth)
 *  - setTicker(symbol, ticker)
 *  - setFeedStatus(payload)
 *
 * Also provides convenience selectors for UI:
 *  - getLatestCandle(symbol)
 *  - getOrderbook(symbol)
 */

type SymbolId = string;

interface MarketDataState {
  // normalized maps
  kline: Record<SymbolId, Candle[]>;
  trades: Record<SymbolId, Trade[]>;
  depth: Record<SymbolId, Depth | undefined>;
  ticker: Record<SymbolId, Ticker | undefined>;

  // meta
  feedStatus: any; // { status, symbol, interval, ... }

  // actions (mutations)
  setKline: (symbol: SymbolId, candleOrArray: Candle | Candle[], trimTo?: number) => void;
  pushTrade: (symbol: SymbolId, trade: Trade, maxLen?: number) => void;
  setDepth: (symbol: SymbolId, depth: Depth) => void;
  setTicker: (symbol: SymbolId, ticker: Ticker) => void;
  setFeedStatus: (payload: any) => void;

  // selectors / helpers (pure functions)
  getLatestCandle: (symbol: SymbolId) => Candle | null;
  getTrades: (symbol: SymbolId, limit?: number) => Trade[];
  getOrderbook: (symbol: SymbolId) => Depth | null;
  clearSymbol: (symbol: SymbolId) => void;
}

// reasonable defaults
const DEFAULT_MAX_CANDLES = 500; // keep recent history per symbol
const DEFAULT_MAX_TRADES = 500;

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  kline: {},
  trades: {},
  depth: {},
  ticker: {},
  feedStatus: null,

  // setKline: accepts single candle (append/update) or full array (snapshot)
  setKline: (symbol, candleOrArray, trimTo = DEFAULT_MAX_CANDLES) =>
    set(
      produce((state: MarketDataState) => {
        const sym = String(symbol).replace("-", "").toUpperCase();
        const existing = state.kline[sym] ?? [];

        if (Array.isArray(candleOrArray)) {
          // full snapshot — replace
          state.kline[sym] = candleOrArray.slice(-trimTo);
          return;
        }

        const candle = candleOrArray as Candle;
        // if last candle has same timestamp, replace last; else push
        if (existing.length > 0 && existing[existing.length - 1].t === candle.t) {
          existing[existing.length - 1] = candle;
        } else {
          existing.push(candle);
        }
        // trim
        if (existing.length > trimTo) {
          state.kline[sym] = existing.slice(existing.length - trimTo);
        } else {
          state.kline[sym] = existing;
        }
      })
    ),

  pushTrade: (symbol, trade, maxLen = DEFAULT_MAX_TRADES) =>
    set(
      produce((state: MarketDataState) => {
        const sym = String(symbol).replace("-", "").toUpperCase();
        const arr = state.trades[sym] ?? [];
        arr.unshift(trade);
        if (arr.length > maxLen) arr.length = maxLen;
        state.trades[sym] = arr;
      })
    ),

  setDepth: (symbol, depth) =>
    set(
      produce((state: MarketDataState) => {
        const sym = String(symbol).replace("-", "").toUpperCase();
        // keep depth normalized (bids desc, asks asc)
        const safeDepth: Depth = {
          bids: Array.isArray(depth.bids)
            ? depth.bids
                .map((d) => ({ price: Number(d.price), size: Number(d.size) }))
                .sort((a, b) => b.price - a.price)
            : [],
          asks: Array.isArray(depth.asks)
            ? depth.asks
                .map((d) => ({ price: Number(d.price), size: Number(d.size) }))
                .sort((a, b) => a.price - b.price)
            : [],
          ts: depth.ts ?? Date.now(),
          mid: depth.mid ?? undefined,
        };
        state.depth[sym] = safeDepth;
      })
    ),

  setTicker: (symbol, ticker) =>
    set(
      produce((state: MarketDataState) => {
        const sym = String(symbol).replace("-", "").toUpperCase();
        state.ticker[sym] = {
          ...ticker,
          symbol: sym,
          bidPrice: ticker.bidPrice ?? ticker.bidPrice,
          askPrice: ticker.askPrice ?? ticker.askPrice,
          lastPrice: ticker.lastPrice ?? ticker.lastPrice,
          ts: ticker.ts ?? Date.now(),
        } as Ticker;
      })
    ),

  setFeedStatus: (payload) =>
    set(
      produce((state: MarketDataState) => {
        state.feedStatus = payload;
      })
    ),

  // selectors
  getLatestCandle: (symbol) => {
    const sym = String(symbol).replace("-", "").toUpperCase();
    const arr = get().kline[sym];
    if (!arr || arr.length === 0) return null;
    return arr[arr.length - 1];
  },

  getTrades: (symbol, limit = 100) => {
    const sym = String(symbol).replace("-", "").toUpperCase();
    const arr = get().trades[sym] ?? [];
    return arr.slice(0, limit);
  },

  getOrderbook: (symbol) => {
    const sym = String(symbol).replace("-", "").toUpperCase();
    return get().depth[sym] ?? null;
  },

  clearSymbol: (symbol) =>
    set(
      produce((state: MarketDataState) => {
        const sym = String(symbol).replace("-", "").toUpperCase();
        delete state.kline[sym];
        delete state.trades[sym];
        delete state.depth[sym];
        delete state.ticker[sym];
      })
    ),
}));

// convenience exports for ad-hoc usage (optional)
export const marketDataStore = useMarketDataStore.getState;
export default useMarketDataStore;
