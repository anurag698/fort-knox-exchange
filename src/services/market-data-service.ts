// src/services/market-data-service.ts
"use client";

import { useMarketDataStore } from "@/state/market-data-store";
import { engineBus } from "@/lib/chart-engine/engine-core"; 
// engineBus is exported in 13.7-A so we can emit global events

export class MarketDataService {
  private static instance: MarketDataService;

  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private symbol: string = "";
  private baseUrl = "wss://wbs.mexc.com/ws";

  private constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new MarketDataService();
    }
    return this.instance;
  }

  // ----------------------------------------------------------
  // Connect to MEXC depth + trades (kline handled in chart-engine.tsx)
  // ----------------------------------------------------------
  connect(symbol: string) {
    this.symbol = symbol.toUpperCase().replace("-", "");

    // Cleanup previous WS
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }

    try {
      this.ws = new WebSocket(this.baseUrl);
    } catch (e) {
      console.error("MarketDataService: WebSocket creation failed", e);
      useMarketDataStore.getState().setError("WS failed");
      return;
    }

    this.ws.onopen = () => {
      console.log("[MEXC-Depth] Connected");
      useMarketDataStore.getState().setConnected(true);

      // Subscribe only to depth + trades
      const sub = {
        method: "SUBSCRIPTION",
        params: [
          `spot@public.bookTicker.v3.api@${this.symbol}`,
          `spot@public.deal.v3.api@${this.symbol}`,
          `spot@public.depth.v3.api@${this.symbol}@0`
        ],
        id: 11,
      };

      try {
        this.ws?.send(JSON.stringify(sub));
      } catch {}

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => this.handle(event.data);

    this.ws.onerror = (err) => {
      console.warn("[MEXC-Depth] WS error", err);
    };

    this.ws.onclose = (ev) => {
      console.warn("[MEXC-Depth] Closed", ev.code, ev.reason);
      useMarketDataStore.getState().setConnected(false);

      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => this.connect(this.symbol), 5000);
      }
    };
  }

  // ----------------------------------------------------------
  // Handle incoming messages
  // ----------------------------------------------------------
  private handle(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (!msg.c) return;

    // ---------------------------
    // BOOK TICKER (ticker)
    // ---------------------------
    if (msg.c.includes("bookTicker")) {
      const d = msg.d;
      const adapted = {
        s: d.symbol,
        c: d.askPrice,
        P: "0.0",
        h: "0",
        l: "0",
        v: "0",
      };

      useMarketDataStore.getState().setTicker(adapted);

      // Forward to chart overlays
      engineBus.emit("ticker", adapted);
      return;
    }

    // ---------------------------
    // RECENT TRADES STREAM
    // ---------------------------
    if (msg.c.includes("deal")) {
      if (Array.isArray(msg.d)) {
        msg.d.forEach((t: any) => {
          const trade = {
            price: parseFloat(t.p),
            size: parseFloat(t.v),
            side: t.S === "buy" ? "buy" : "sell",
            ts: t.t,
          };

          // Zustand state
          useMarketDataStore.getState().pushTrade(trade);

          // Chart trade marker
          engineBus.emit("trade", trade);
        });
      }
      return;
    }

    // ---------------------------
    // DEPTH STREAM
    // ---------------------------
    if (msg.c.includes("depth")) {
      if (!msg.d) return;

      const bids = msg.d.bids || [];
      const asks = msg.d.asks || [];

      // Zustand state
      useMarketDataStore.getState().setDepth(bids, asks);

      // Chart depth overlay
      engineBus.emit("internal-depth", {
        bids: bids.map((b: any) => ({
          price: parseFloat(b[0]),
          size: parseFloat(b[1]),
        })),
        asks: asks.map((a: any) => ({
          price: parseFloat(a[0]),
          size: parseFloat(a[1]),
        })),
      });
    }
  }

  kill() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
  }
}

// ---------------------------------------------
// Export the singleton instance (fixes your error)
// ---------------------------------------------
export const marketDataService = MarketDataService.getInstance();