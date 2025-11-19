"use client";

import { bus } from "@/components/event-bus";

// -----------------------------
// Types
// -----------------------------
export interface DepthLevel {
  price: number;
  size: number;
}

export interface KlineMessage {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

// -----------------------------
// MarketDataService
// -----------------------------
class MarketDataService {
  private static services = new Map<string, MarketDataService>();

  private symbol: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;

  private constructor(symbol: string) {
    this.symbol = symbol.toUpperCase().replace("-", "");
  }

  static get(symbol: string): MarketDataService {
    const key = symbol.toUpperCase();
    if (!this.services.has(key)) {
      this.services.set(key, new MarketDataService(symbol));
    }
    return this.services.get(key)!;
  }

  connect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    try {
      this.ws = new WebSocket("wss://wbs.mexc.com/ws");
    } catch (e) {
      console.error("WS creation failed", e);
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

        // TICKER
        if (msg.c.includes("bookTicker")) {
          bus.emit("ticker", msg.d);
        }

        // TRADES
        if (msg.c.includes("deal")) {
          if (Array.isArray(msg.d.d)) {
            for (const t of msg.d.d) {
              bus.emit("trade", t);
            }
          }
        }

        // DEPTH
        if (msg.c.includes("depth")) {
          bus.emit("depth", {
            bids: msg.d?.bids ?? [],
            asks: msg.d?.asks ?? [],
          });
        }

        // KLINE
        if (msg.c.includes("kline")) {
          const k = msg.d?.k;
          if (k) bus.emit("kline", k);
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    this.ws.onerror = (ev) => {
      console.error("WS error", ev);
    };

    this.ws.onclose = () => {
      // Skip reconnect inside Firebase Studio sandbox
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

export { MarketDataService };
