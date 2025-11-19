
// src/services/market-data-subscriber.ts
/**
 * market-data-subscriber.ts
 * - Single place to convert events from the market-data service into store updates.
 * - Keeps normalization and debouncing in one place.
 */

import { bus } from "@/components/bus";
import { useMarketDataStore } from "@/state/market-data-store";
import { Candle, Trade, Depth, Ticker } from "@/lib/market-types";

let initialized = false;

export function startMarketDataSubscriber() {
  if (initialized) return;
  initialized = true;

  const store = useMarketDataStore.getState();

  // kline handler
  bus.on("kline", (payload: { symbol?: string; interval?: string; candle?: Candle }) => {
    try {
      if (!payload || !payload.symbol || !payload.candle) return;
      const sym = String(payload.symbol).replace("-", "").toUpperCase();
      store.setKline(sym, payload.candle);
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("kline handler error", e);
    }
  });

  // trade handler
  bus.on("trade", (payload: { symbol?: string; trade?: Trade }) => {
    try {
      if (!payload || !payload.symbol || !payload.trade) return;
      const sym = String(payload.symbol).replace("-", "").toUpperCase();
      store.pushTrade(sym, payload.trade);
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("trade handler err", e);
    }
  });

  // depth handler
  bus.on("depth", (payload: { symbol?: string; depth?: Depth }) => {
    try {
      if (!payload || !payload.symbol || !payload.depth) return;
      const sym = String(payload.symbol).replace("-", "").toUpperCase();
      store.setDepth(sym, payload.depth);
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("depth handler err", e);
    }
  });

  // ticker handler
  bus.on("ticker", (payload: { symbol?: string; ticker?: Ticker }) => {
    try {
      if (!payload || !payload.symbol || !payload.ticker) return;
      const sym = String(payload.symbol).replace("-", "").toUpperCase();
      store.setTicker(sym, payload.ticker);
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.warn("ticker handler err", e);
    }
  });

  // status handler (optional)
  bus.on("market-feed:status", (payload: any) => {
    try {
      store.setFeedStatus(payload);
    } catch {}
  });
}

export function stopMarketDataSubscriber() {
  // Not strictly necessary; you can implement bus.off for each event if required.
}
