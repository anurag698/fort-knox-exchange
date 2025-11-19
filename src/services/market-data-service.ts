"use client";

import { bus } from "@/components/bus";

/**
 * Market Data Service for Fort Knox Exchange
 * MEXC Socket → Event Bus → Zustand Store / Chart Engine
 */

class MarketDataService {
  private static instances: Map<string, MarketDataService> = new Map();

  private symbol: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;

  private constructor(symbol: string) {
    this.symbol = symbol.toUpperCase().replace("-", "");
  }

  // ----------------------------------------------------
  // Static Getter
  // ----------------------------------------------------
  static get(symbol: string): MarketDataService {
    const key = symbol.toUpperCase().replace("-", "");

    if (!this.instances.has(key)) {
      this.instances.set(key, new MarketDataService(key));
    }
    return this.instances.get(key)!;
  }

  // ----------------------------------------------------
  // Connect to MEXC
  // ----------------------------------------------------
  connect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    try {
      this.ws = new WebSocket("wss://wbs.mexc.com/ws");
    } catch (err) {
      console.error("WS creation failed:", err);
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;

      const subs = {
        method: "SUBSCRIPTION",
        params: [
          `spot@public.bookTicker.v3.api@${this.symbol}`,
          `spot@public.deal.v3.api@${this.symbol}`,
          `spot@public.kline.v3.api@${this.symbol}@Min1`,
          `spot@public.depth.v3.api@${this.symbol}@0`,
        ],
        id: Date.now(),
      };

      try {
        this.ws?.send(JSON.stringify(subs));
      } catch {}
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg.c) return;

        // -------- TICKER ----------
        if (msg.c.includes("bookTicker")) {
          bus.emit("ticker", msg.d);
        }

        // -------- TRADES ----------
        if (msg.c.includes("deal") && Array.isArray(msg.d)) {
          msg.d.forEach((trade: any) => {
            bus.emit("trade", trade);
          });
        }

        // -------- DEPTH ----------
        if (msg.c.includes("depth")) {
          bus.emit("depth", {
            bids: msg.d?.bids ?? [],
            asks: msg.d?.asks ?? [],
          });
        }

        // -------- KLINE ----------
        if (msg.c.includes("kline") && msg.d?.kline) {
          bus.emit("kline", msg.d.kline);
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    this.ws.onerror = (err) => {
      console.error("WS error", err);
    };

    this.ws.onclose = () => {
      // Firebase Studio sandbox block – do not reconnect
      if (typeof window !== "undefined" && window.location.href.includes("firebase")) {
        return;
      }

      this.reconnectAttempts++;
      const delay = Math.min(5000, this.reconnectAttempts * 1000);

      setTimeout(() => this.connect(), delay);
    };
  }

  disconnect() {
    try {
      this.ws?.close();
    } catch {}
    this.ws = null;
  }
}

// ----------------------------------------------------
// EXPORT CORRECTLY
// ----------------------------------------------------
export { MarketDataService };
