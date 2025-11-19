// src/services/market-data-subscriber.ts
"use client";

import { bus } from "@/components/bus";
import marketDataAdapter from "@/services/market-data-adapter";
import marketDataRouter from "@/services/market-data-router";
import marketDataService from "@/services/market-data-service";
import { useMarketDataStore } from "@/state/market-data-store";

/**
 * Market Data Subscriber / Store Adaptor (File 3/3)
 *
 * Responsibilities:
 *  - Attach to bus events and forward normalized payloads into the Zustand store
 *  - Provide a small public API to start/stop for a symbol/interval
 *  - Expose helper getters for current snapshots
 *  - Make subscriptions idempotent and safe for Firebase Studio (throttling)
 *
 * Usage:
 *   import { marketDataSubscriber } from "@/services/market-data-subscriber";
 *   marketDataSubscriber.init(); // attach listeners once
 *   marketDataSubscriber.start("BTCUSDT", "1m");
 *   // ...
 *   marketDataSubscriber.stop();
 */

type KlineRaw = any;
type TradeRaw = any;
type DepthRaw = any;
type TickerRaw = any;

class MarketDataSubscriber {
  private initialized = false;
  private running = false;
  private currentSymbol: string | null = null;
  private currentInterval: string = "1m";

  // throttles / timers
  private klineTimer: any = null;
  private depthTimer: any = null;

  // sandbox detection
  private isSandbox = typeof window !== "undefined" && window.location.href.includes("firebase");

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // kline -> store.pushKline (throttled)
    bus.on("kline", (raw: KlineRaw) => {
      try {
        const k = this.normalizeKline(raw);
        // throttle a bit to avoid flooding UI in sandbox
        if (this.klineTimer) {
          (this as any)._pendingKline = k;
          return;
        }
        useMarketDataStore.getState().pushKline(k);
        const delay = this.isSandbox ? 500 : 60;
        this.klineTimer = setTimeout(() => {
          this.klineTimer = null;
          const p = (this as any)._pendingKline;
          if (p) {
            useMarketDataStore.getState().pushKline(p);
            delete (this as any)._pendingKline;
          }
        }, delay);
      } catch (e) {
        console.warn("subscriber.kline error", e);
      }
    });

    // trades -> store.pushTrade
    bus.on("trade", (raw: TradeRaw) => {
      try {
        const t = this.normalizeTrade(raw);
        useMarketDataStore.getState().pushTrade(t);
      } catch (e) {
        console.warn("subscriber.trade error", e);
      }
    });

    // depth -> store.pushDepth (throttled)
    bus.on("depth", (raw: DepthRaw) => {
      try {
        const d = this.normalizeDepth(raw);
        if (this.depthTimer) {
          (this as any)._pendingDepth = d;
          return;
        }
        useMarketDataStore.getState().pushDepth(d);
        const delay = this.isSandbox ? 400 : 100;
        this.depthTimer = setTimeout(() => {
          this.depthTimer = null;
          const p = (this as any)._pendingDepth;
          if (p) {
            useMarketDataStore.getState().pushDepth(p);
            delete (this as any)._pendingDepth;
          }
        }, delay);
      } catch (e) {
        console.warn("subscriber.depth error", e);
      }
    });

    // ticker -> store.pushTicker
    bus.on("ticker", (raw: TickerRaw) => {
      try {
        const t = this.normalizeTicker(raw);
        useMarketDataStore.getState().pushTicker(t);
      } catch (e) {
        console.warn("subscriber.ticker error", e);
      }
    });

    // Router/Adapter status hooks (optional)
    bus.on("market-feed:status", (s: any) => {
      bus.emit("ui:feed-status", s); // UI can listen for this
    });
    bus.on("adapter:status", (s: any) => {
      bus.emit("ui:adapter-status", s);
    });
    bus.on("router:status", (s: any) => {
      bus.emit("ui:router-status", s);
    });
  }

  start(symbol: string, interval = "1m") {
    if (!symbol) throw new Error("MarketDataSubscriber.start requires symbol");
    this.init();
    this.currentSymbol = symbol.replace("-", "").toUpperCase();
    this.currentInterval = interval;

    // start lower-level router/adapter/service as needed
    // router.start will call marketDataService.startFeed internally (already wired in earlier files)
    try {
      marketDataRouter.start(this.currentSymbol, this.currentInterval);
    } catch (e) {
      // fallback: call adapter directly
      try {
        marketDataAdapter.start(this.currentSymbol, this.currentInterval);
      } catch (err) {
        console.warn("fallback start failed", err);
      }
    }

    this.running = true;
  }

  stop() {
    if (!this.running) return;
    try {
      marketDataRouter.stop();
    } catch (e) {
      // ignore
    }
    try {
      marketDataAdapter.stop();
    } catch (e) {
      // ignore
    }
    try {
      marketDataService.stopFeed();
    } catch (e) {
      // ignore
    }
    this.running = false;
    this.currentSymbol = null;
  }

  // ----------------------------------------
  // Normalize helpers
  // ----------------------------------------
  private normalizeKline(raw: any) {
    // Accept multiple shapes
    const t = Number(raw.t ?? raw.ts ?? raw.time ?? Date.now());
    const o = Number(raw.o ?? raw.open ?? raw[1] ?? raw[0] ?? 0);
    const h = Number(raw.h ?? raw.high ?? raw[2] ?? 0);
    const l = Number(raw.l ?? raw.low ?? raw[3] ?? 0);
    const c = Number(raw.c ?? raw.close ?? raw[4] ?? 0);
    const v = Number(raw.v ?? raw.volume ?? raw[5] ?? 0);
    const final = !!raw.final || raw.e === "kline_end";
    return { t, o, h, l, c, v, final };
  }

  private normalizeTrade(raw: any) {
    const p = Number(raw.p ?? raw.price ?? raw[0] ?? 0);
    const q = Number(raw.q ?? raw.v ?? raw.size ?? raw[1] ?? 0);
    const S = raw.S ?? raw.side ?? (raw.m ? "sell" : "buy");
    const t = Number(raw.t ?? raw.ts ?? Date.now());
    return { p, q, S: S === "sell" ? "sell" : "buy", t };
  }

  private normalizeDepth(raw: any) {
    // Accept {bids: [[p,s],..], asks: [[p,s],..], mid }
    const toLevels = (arr: any[] = []) =>
      arr.map((lvl: any) => ({ price: Number(lvl[0]), size: Number(lvl[1]) }));

    const bids = toLevels(raw.bids || raw.buy || raw.asks?.buy || []);
    const asks = toLevels(raw.asks || raw.sell || raw.asks?.sell || []);
    const mid = Number(raw.mid ?? raw.midPrice ?? 0);
    return { bids, asks, mid };
  }

  private normalizeTicker(raw: any) {
    return {
      lastPrice: Number(raw.lastPrice ?? raw.c ?? raw.p ?? 0),
      askPrice: Number(raw.askPrice ?? raw.a ?? raw.ask ?? 0),
      bidPrice: Number(raw.bidPrice ?? raw.b ?? raw.bid ?? 0),
      vol: Number(raw.vol ?? raw.v ?? raw.volume ?? 0),
      ts: Number(raw.ts ?? raw.t ?? Date.now()),
    };
  }

  // ----------------------------------------
  // Helpers for other modules
  // ----------------------------------------
  getSnapshot() {
    const s = useMarketDataStore.getState();
    return {
      symbol: s.symbol,
      interval: s.interval,
      lastKline: s.lastKline,
      depth: s.depth,
      trades: s.trades,
      ticker: s.ticker,
    };
  }
}

export const marketDataSubscriber = new MarketDataSubscriber();
export default marketDataSubscriber;

    