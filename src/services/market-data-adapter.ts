// src/services/market-data-adapter.ts
"use client";

import { bus } from "@/components/bus";
import marketDataService from "@/services/market-data-service";
import { useMarketDataStore } from "@/state/market-data-store";

/**
 * MarketDataAdapter (Pure Push Model)
 *
 * Responsibilities:
 *  - Start / stop the unified feed for a symbol+interval
 *  - Listen to normalized events emitted on `bus` by liveFeedBridge
 *  - Throttle / normalize and push into Zustand store (useMarketDataStore)
 *  - Provide simple subscribe/unsubscribe helpers and status events
 *
 * Usage:
 *   marketDataAdapter.start("BTCUSDT", "1m");
 *   marketDataAdapter.stop();
 *
 *   marketDataAdapter.on("kline", cb);
 *   marketDataAdapter.off("kline", cb);
 */

type Kline = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  final?: boolean;
};

type Trade = {
  p: number | string;
  v?: number | string;
  size?: number;
  q?: number;
  S?: "buy" | "sell";
  t?: number;
};

type DepthPayload = {
  bids?: [number | string, number | string][];
  asks?: [number | string, number | string][];
  mid?: number;
};

type AdapterStatus = "idle" | "starting" | "running" | "stopped" | "error" | "offline";

class MarketDataAdapter {
  private symbol: string | null = null;
  private interval: string = "1m";
  private status: AdapterStatus = "idle";

  // internal listener references so we can off() them
  private fnKline: ((d: any) => void) | null = null;
  private fnTrade: ((d: any) => void) | null = null;
  private fnDepth: ((d: any) => void) | null = null;
  private fnTicker: ((d: any) => void) | null = null;

  // throttles
  private klineTimer: any = null;
  private depthTimer: any = null;

  // sandbox detection (Firebase Studio)
  private isSandbox = typeof window !== "undefined" && window.location.href.includes("firebase");

  start(symbol: string, interval = "1m") {
    // normalize
    const normalizedSymbol = symbol.replace("-", "").toUpperCase();
    this.symbol = normalizedSymbol;
    this.interval = interval;

    this.setStatus("starting");

    // stop any previous feed/listeners
    this.stop();

    // ensure store symbol/interval set
    try {
      useMarketDataStore.getState().setSymbol(normalizedSymbol);
      useMarketDataStore.getState().setInterval(interval);
    } catch (e) {
      console.warn("MarketDataAdapter: unable to set store symbol/interval", e);
    }

    // start the feed via the central marketDataService
    try {
      marketDataService.startFeed(normalizedSymbol, interval);
    } catch (e) {
      console.warn("MarketDataAdapter: marketDataService.startFeed failed", e);
    }

    // attach listeners
    this.attachListeners();

    this.setStatus("running");
    bus.emit("adapter:status", { status: this.status, symbol: normalizedSymbol, interval });
  }

  stop() {
    // detach listeners
    this.detachListeners();

    // stop central feed (singleton)
    try {
      marketDataService.stopFeed();
    } catch (e) {
      console.warn("MarketDataAdapter: marketDataService.stopFeed failed", e);
    }

    this.setStatus("stopped");
    bus.emit("adapter:status", { status: this.status });
  }

  private setStatus(s: AdapterStatus) {
    this.status = s;
  }

  private attachListeners() {
    // create stable callback refs so off() works correctly
    this.fnKline = (raw: any) => {
      try {
        // normalize MEXC/FKX/Offline shape -> Kline
        const k: Kline = {
          t: Number(raw.t || raw.ts || raw.time || raw[0] || Date.now()),
          o: Number(raw.o ?? raw.open ?? raw[1] ?? 0),
          h: Number(raw.h ?? raw.high ?? raw[2] ?? 0),
          l: Number(raw.l ?? raw.low ?? raw[3] ?? 0),
          c: Number(raw.c ?? raw.close ?? raw[4] ?? 0),
          v: Number(raw.v ?? raw.volume ?? raw[5] ?? 0),
          final: !!raw.final,
        };

        // throttle high-frequency updates when sandboxed or in heavy load
        const throttleMs = this.isSandbox ? 500 : 60;
        if (this.klineTimer) {
          // store last incoming and return; timer will flush it
          (this as any)._pendingK = k;
          return;
        }

        // immediate push
        useMarketDataStore.getState().pushKline(k);

        // set throttle timer to flush last pending if any
        this.klineTimer = setTimeout(() => {
          this.klineTimer = null;
          const pending = (this as any)._pendingK;
          if (pending) {
            useMarketDataStore.getState().pushKline(pending);
            delete (this as any)._pendingK;
          }
        }, throttleMs);
      } catch (e) {
        console.warn("adapter.kline failed", e);
      }
    };

    this.fnTrade = (raw: any) => {
      try {
        // normalize trade
        const t: Trade = {
          p: Number(raw.p ?? raw.price ?? raw[0] ?? raw.lastPrice ?? 0),
          v: Number(raw.v ?? raw.q ?? raw.size ?? raw[1] ?? 0),
          S: raw.S ?? raw.side ?? (raw.m ? (raw.m ? "sell" : "buy") : undefined),
          t: Number(raw.t ?? raw.ts ?? Date.now()),
        };

        useMarketDataStore.getState().pushTrade({
          p: Number(t.p),
          q: Number(t.v ?? t.q),
          S: (t.S as "buy" | "sell") || (t.p ? "buy" : "sell"),
          t: t.t || Date.now(),
        });
      } catch (e) {
        console.warn("adapter.trade failed", e);
      }
    };

    this.fnDepth = (raw: any) => {
      try {
        // raw may be {bids: [[p,s],...], asks: [[p,s],...], mid }
        const d: DepthPayload = raw;
        // Convert to DepthData (arrays of price,size numbers)
        const toLevels = (arr: any[] = []) =>
          arr.map((lvl: any) => ({
            price: Number(lvl[0]),
            size: Number(lvl[1]),
          }));

        // throttle depth redraws (heatmap)
        const throttleMs = this.isSandbox ? 400 : 100;
        if (this.depthTimer) {
          (this as any)._pendingDepth = d;
          return;
        }

        useMarketDataStore.getState().pushDepth({
          bids: toLevels(d.bids || []),
          asks: toLevels(d.asks || []),
          mid: Number(d.mid || 0),
        });

        this.depthTimer = setTimeout(() => {
          this.depthTimer = null;
          const pending = (this as any)._pendingDepth;
          if (pending) {
            useMarketDataStore.getState().pushDepth({
              bids: toLevels(pending.bids || []),
              asks: toLevels(pending.asks || []),
              mid: Number(pending.mid || 0),
            });
            delete (this as any)._pendingDepth;
          }
        }, throttleMs);
      } catch (e) {
        console.warn("adapter.depth failed", e);
      }
    };

    this.fnTicker = (raw: any) => {
      try {
        // normalize ticker shape
        const t = {
          lastPrice: Number(raw.lastPrice ?? raw.c ?? raw.p),
          askPrice: Number(raw.askPrice ?? raw.a),
          bidPrice: Number(raw.bidPrice ?? raw.b),
          vol: Number(raw.vol ?? raw.v),
          ts: Number(raw.ts ?? raw.t ?? Date.now()),
        };

        useMarketDataStore.getState().pushTicker(t);
      } catch (e) {
        console.warn("adapter.ticker failed", e);
      }
    };

    // subscribe to bus events
    bus.on("kline", this.fnKline);
    bus.on("trade", this.fnTrade);
    bus.on("depth", this.fnDepth);
    bus.on("ticker", this.fnTicker);

    // also forward adapter status notifications
    bus.emit("adapter:attached", { symbol: this.symbol, interval: this.interval });
  }

  private detachListeners() {
    if (this.fnKline) bus.off("kline", this.fnKline);
    if (this.fnTrade) bus.off("trade", this.fnTrade);
    if (this.fnDepth) bus.off("depth", this.fnDepth);
    if (this.fnTicker) bus.off("ticker", this.fnTicker);

    this.fnKline = null;
    this.fnTrade = null;
    this.fnDepth = null;
    this.fnTicker = null;

    // clear throttles
    if (this.klineTimer) {
      clearTimeout(this.klineTimer);
      this.klineTimer = null;
      delete (this as any)._pendingK;
    }
    if (this.depthTimer) {
      clearTimeout(this.depthTimer);
      this.depthTimer = null;
      delete (this as any)._pendingDepth;
    }

    bus.emit("adapter:detached", { symbol: this.symbol });
  }

  // public short-hand subscribe to bus (rarely used, prefer store)
  on(event: "kline" | "trade" | "depth" | "ticker" | "adapter:status", cb: (...args: any[]) => void) {
    bus.on(event, cb);
  }

  off(event: string, cb?: (...args: any[]) => void) {
    bus.off(event, cb as any);
  }
}

// export singleton
export const marketDataAdapter = new MarketDataAdapter();
export default marketDataAdapter;
