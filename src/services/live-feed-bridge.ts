// ------------------------------------------------------
// Fort Knox Exchange — Unified Real-Time Feed Bridge
// Part 13.7-F (1/4)
// ------------------------------------------------------

"use client";

import { bus } from "@/components/bus";

type FeedStatus = "offline" | "mexc" | "fkx" | "connected";

class LiveFeedBridge {
  private fkxWS: WebSocket | null = null;
  private mexcWS: WebSocket | null = null;
  private offlineTimer: NodeJS.Timeout | null = null;

  private symbol: string = "BTCUSDT";
  private interval: string = "1m";

  private fkxConnected = false;
  private mexcConnected = false;

  private fkxFailed = false;
  private mexcFailed = false;

  public status: FeedStatus = "offline";

  // ------------------------------------------------------
  // Start unified feed
  // ------------------------------------------------------
  start(symbol: string, interval: string) {
    this.symbol = symbol.toUpperCase();
    this.interval = interval;

    this.stop();  // stop old feed  
    this.connectFKX();
    this.watchBootstrap();
  }

  // ------------------------------------------------------
  // Stop all sessions safely
  // ------------------------------------------------------
  stop() {
    this.fkxWS?.close();
    this.mexcWS?.close();
    this.fkxWS = null;
    this.mexcWS = null;

    this.fkxFailed = false;
    this.mexcFailed = false;

    this.fkxConnected = false;
    this.mexcConnected = false;

    if (this.offlineTimer) clearInterval(this.offlineTimer);
    this.offlineTimer = null;

    this.status = "offline";
  }

  // ------------------------------------------------------
  // Primary: FKX native feed
  // ------------------------------------------------------
  private connectFKX() {
    try {
      this.fkxWS = new WebSocket("wss://api.fortknox.com/ws");

      this.fkxWS.onopen = () => {
        this.fkxConnected = true;
        this.fkxFailed = false;
        this.status = "fkx";

        this.fkxWS?.send(JSON.stringify({
          type: "subscribe",
          channel: "kline",
          symbol: this.symbol,
          interval: this.interval,
        }));

        console.log("[FKX] Connected (primary)");
      };

      this.fkxWS.onerror = () => {
        this.fkxFailed = true;
        console.warn("[FKX] Error");
      };

      this.fkxWS.onclose = () => {
        this.fkxConnected = false;
        this.fkxFailed = true;
        console.warn("[FKX] Closed");

        // Try fallback to MEXC
        if (!this.mexcConnected && !this.mexcFailed) this.connectMEXC();
      };

      this.fkxWS.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);

          // FKX realtime kline
          if (msg.type === "kline" && msg.candle) {
            bus.emit("kline", msg.candle);
          }

          // FKX realtime trades
          if (msg.type === "trade") {
            bus.emit("trade", msg.data);
          }

          // FKX depth
          if (msg.type === "depth") {
            bus.emit("depth", msg.data);
          }

          // FKX ticker
          if (msg.type === "ticker") {
            bus.emit("ticker", msg.data);
          }
        } catch (e) {
          console.error("[FKX] Parse error:", e);
        }
      };

    } catch (e) {
      this.fkxFailed = true;
      console.error("[FKX] Failed to connect", e);
    }
  }

  // ------------------------------------------------------
  // Fallback: MEXC feed
  // ------------------------------------------------------
  private connectMEXC() {
    try {
      this.mexcWS = new WebSocket("wss://wbs.mexc.com/ws");

      this.mexcWS.onopen = () => {
        this.mexcConnected = true;
        this.mexcFailed = false;
        this.status = "mexc";

        const sub = {
          method: "SUBSCRIPTION",
          params: [
            `spot@public.kline.v3.api@${this.symbol}@Min1`,
            `spot@public.deal.v3.api@${this.symbol}`,
            `spot@public.depth.v3.api@${this.symbol}@0`,
            `spot@public.bookTicker.v3.api@${this.symbol}`,
          ],
          id: 1001,
        };

        this.mexcWS?.send(JSON.stringify(sub));

        console.log("[MEXC] Connected (fallback)");
      };

      this.mexcWS.onerror = () => {
        this.mexcFailed = true;
        console.warn("[MEXC] Error");
      };

      this.mexcWS.onclose = () => {
        this.mexcConnected = false;
        this.mexcFailed = true;
        console.warn("[MEXC] Closed");

        // Try offline if nothing else works
        if (!this.fkxConnected) this.startOfflineFallback();
      };

      this.mexcWS.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (!msg.c) return;

          // -------------- MEXC KLINE --------------
          if (msg.c.includes("kline")) {
            const d = msg.d;
            const k = {
              t: d.ts,
              o: Number(d.o),
              h: Number(d.h),
              l: Number(d.l),
              c: Number(d.c),
              v: Number(d.v),
              final: d.e === "kline_end",
            };
            bus.emit("kline", k);
          }

          // -------------- MEXC TRADES --------------
          if (msg.c.includes("deal") && Array.isArray(msg.d)) {
            msg.d.forEach((trade: any) => {
              bus.emit("trade", {
                p: trade.p,
                v: trade.v,
                t: trade.t,
                S: trade.S,
              });
            });
          }

          // -------------- DEPTH --------------
          if (msg.c.includes("depth")) {
            bus.emit("depth", msg.d);
          }

          // -------------- TICKER --------------
          if (msg.c.includes("bookTicker")) {
            bus.emit("ticker", msg.d);
          }
        } catch (e) {
          console.error("[MEXC] Parse error:", e);
        }
      };

    } catch (e) {
      this.mexcFailed = true;
      console.error("[MEXC] Connection failure:", e);
    }
  }

  // ------------------------------------------------------
  // Offline Simulator (Firebase Studio safe)
  // ------------------------------------------------------
  private startOfflineFallback() {
    if (this.offlineTimer) return;

    console.warn("[Offline] Simulator enabled");
    this.status = "offline";

    this.offlineTimer = setInterval(() => {
      const now = Date.now();
      const c = 100 + Math.random() * 2 - 1;

      const k = {
        t: now,
        o: c - 0.5,
        h: c + 1,
        l: c - 1,
        c,
        v: Math.random() * 3,
        final: false,
      };

      bus.emit("kline", k);
    }, 1500);
  }

  // ------------------------------------------------------
  // Bootstrap checker
  // ------------------------------------------------------
  private watchBootstrap() {
    setTimeout(() => {
      if (!this.fkxConnected && !this.mexcConnected) {
        console.warn("[Feed] No WS → offline fallback");
        this.startOfflineFallback();
      }
    }, 3500);
  }
}

// Singleton instance
export const liveFeedBridge = new LiveFeedBridge();
