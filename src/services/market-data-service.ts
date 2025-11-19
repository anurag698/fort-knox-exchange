
"use client";

import { bus } from "@/components/bus";

/**
 * Part 13.7-E
 * Unified Event-Bridge for:
 *  - FKX WebSocket (primary)
 *  - MEXC WebSocket (fallback)
 *  - Offline simulator (Firebase Studio safe mode)
 *
 * This replaces older market-data-service entirely.
 */

type Listener = (data: any) => void;

class HybridFeed {
  symbol: string;
  interval: string;

  fkxWS: WebSocket | null = null;
  mexcWS: WebSocket | null = null;

  fkxConnected = false;
  mexcConnected = false;

  fkxFailed = false;
  mexcFailed = false;

  offlineTimer: any = null;

  constructor(symbol: string, interval: string) {
    this.symbol = symbol.toUpperCase();
    this.interval = interval;
  }

  // ------------------------------------------------------------
  // START ROUTER
  // ------------------------------------------------------------
  start() {
    this.connectFKX();

    // Safety fallback timeout
    setTimeout(() => {
      if (!this.fkxConnected && !this.mexcConnected) {
        console.warn("[HybridFeed] No WS available → Offline Mode");
        this.startOffline();
      }
    }, 2500);
  }

  // ------------------------------------------------------------
  // STOP ROUTER
  // ------------------------------------------------------------
  stop() {
    if (this.fkxWS) this.fkxWS.close();
    if (this.mexcWS) this.mexcWS.close();
    if (this.offlineTimer) clearInterval(this.offlineTimer);
  }

  // ------------------------------------------------------------
  // OFFLINE SIMULATOR (for Firebase Studio)
  // ------------------------------------------------------------
  startOffline() {
    if (this.offlineTimer) return;

    console.warn("[HybridFeed] Offline fallback activated.");

    let last = Date.now();

    this.offlineTimer = setInterval(() => {
      last += 60_000;

      const o = 100 + Math.random() * 2;
      const c = o + (Math.random() - 0.5) * 4;

      const k = {
        t: last,
        o,
        h: Math.max(o, c) + Math.random(),
        l: Math.min(o, c) - Math.random(),
        c,
        v: Math.random() * 5,
        final: false,
      };

      bus.emit("kline", k);

      // Simulate trades
      bus.emit("trade", {
        t: last,
        p: c,
        size: Math.random() * 0.1,
        side: Math.random() > 0.5 ? "buy" : "sell",
      });

      // Simulate depth
      bus.emit("depth", {
        bids: [[c - 1, Math.random() * 4]],
        asks: [[c + 1, Math.random() * 4]],
        mid: c,
      });

      // Simulate ticker
      bus.emit("ticker", {
        lastPrice: c,
        askPrice: c + 0.5,
        bidPrice: c - 0.5,
        vol: Math.random() * 100,
      });
    }, 1500);
  }

  stopOffline() {
    if (this.offlineTimer) {
      clearInterval(this.offlineTimer);
      this.offlineTimer = null;
    }
  }

  // ------------------------------------------------------------
  // FKX WS (Primary)
  // ------------------------------------------------------------
  connectFKX() {
    try {
      this.fkxWS = new WebSocket("wss://api.fortknox.com/ws");

      this.fkxWS.onopen = () => {
        this.fkxConnected = true;

        this.fkxWS?.send(
          JSON.stringify({
            type: "subscribe",
            channel: "kline",
            symbol: this.symbol,
            interval: this.interval,
          })
        );

        this.stopOffline();
        console.log("[FKX WS] Connected");
      };

      this.fkxWS.onerror = () => {
        this.fkxFailed = true;
        console.warn("[FKX WS] error");
      };

      this.fkxWS.onclose = () => {
        this.fkxConnected = false;
        this.fkxFailed = true;
        console.warn("[FKX WS] closed");

        if (!this.mexcConnected) this.connectMEXC();
        else this.startOffline();
      };

      this.fkxWS.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          if (msg.type === "kline" && msg.candle) {
            bus.emit("kline", msg.candle);
          }

          if (msg.type === "depth") {
            bus.emit("depth", msg.depth);
          }

          if (msg.type === "trade") {
            bus.emit("trade", msg.trade);
          }

          if (msg.type === "ticker") {
            bus.emit("ticker", msg.ticker);
          }
        } catch (e) {
          console.error("[FKX WS] parse error", e);
        }
      };
    } catch (err) {
      console.error("[FKX WS] failed", err);
      this.fkxFailed = true;
    }
  }

  // ------------------------------------------------------------
  // MEXC WS (Fallback)
  // ------------------------------------------------------------
  connectMEXC() {
    try {
      this.mexcWS = new WebSocket("wss://wbs.mexc.com/ws");

      this.mexcWS.onopen = () => {
        this.mexcConnected = true;

        this.mexcWS?.send(
          JSON.stringify({
            method: "SUBSCRIPTION",
            params: [`spot@public.kline.v3.api@${this.symbol}@Min1`],
            id: 99,
          })
        );

        console.log("[MEXC WS] Connected fallback");
      };

      this.mexcWS.onerror = () => {
        this.mexcFailed = true;
      };

      this.mexcWS.onclose = () => {
        this.mexcConnected = false;
        this.mexcFailed = true;

        if (!this.fkxConnected) this.startOffline();
      };

      this.mexcWS.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          // KLINE
          if (msg.c && msg.c.includes("kline")) {
            const d = msg.d;
            if (d) {
              const candle = {
                t: d.ts,
                o: Number(d.o),
                h: Number(d.h),
                l: Number(d.l),
                c: Number(d.c),
                v: Number(d.v),
                final: d.e === "kline_end",
              };
              bus.emit("kline", candle);
            }
          }

          // TRADES
          if (msg.c && msg.c.includes("trade")) {
            bus.emit("trade", {
              t: msg.d.ts,
              p: Number(msg.d.p),
              size: Number(msg.d.v),
              side: msg.d.S,
            });
          }
        } catch (e) {}
      };
    } catch (err) {
      this.mexcFailed = true;
    }
  }
}

// ------------------------------------------------------------
// SERVICE SINGLETON CACHE
// ------------------------------------------------------------
const cache: Record<string, HybridFeed> = {};

export const MarketDataService = {
  get(symbol: string, interval: string) {
    const key = `${symbol}_${interval}`;

    if (!cache[key]) {
      cache[key] = new HybridFeed(symbol, interval);
    }

    return cache[key];
  },

  stop(symbol: string, interval: string) {
    const key = `${symbol}_${interval}`;
    if (cache[key]) cache[key].stop();
  },
};
