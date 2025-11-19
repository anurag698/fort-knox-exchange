"use client";

import { useMarketDataStore } from "@/state/market-data-store";

export class MarketDataService {
  private static map = new Map<string, MarketDataService>();

  private symbol: string;
  private ws: WebSocket | null = null;

  private reconnecting = false;
  private reconnectAttempts = 0;
  private killed = false;

  static get(symbol: string) {
    const key = symbol.toUpperCase();
    if (!this.map.has(key)) {
      this.map.set(key, new MarketDataService(key));
    }
    return this.map.get(key)!;
  }

  private constructor(symbol: string) {
    this.symbol = symbol;
  }

  connect() {
    this.kill();
    this.killed = false;

    const safeSymbol = this.symbol.replace("-", "").toUpperCase();
    const url = "wss://wbs.mexc.com/ws";

    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      useMarketDataStore.getState().setError("WS initialization failed.");
      this.startPollingFallback();
      return;
    }

    this.ws.onopen = () => {
      useMarketDataStore.getState().setConnected(true);
      useMarketDataStore.getState().setError(null);

      this.ws?.send(
        JSON.stringify({
          method: "SUBSCRIPTION",
          params: [
            `spot@public.bookTicker.v3.api@${safeSymbol}`,
            `spot@public.deal.v3.api@${safeSymbol}`,
            `spot@public.depth.v3.api@${safeSymbol}@0`,
          ],
          id: 1,
        })
      );

      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      if (!msg || !msg.c) return;

      // BOOK TICKER
      if (msg.c.includes("bookTicker")) {
        const d = msg.d;
        if (!d) return;

        useMarketDataStore.getState().setTicker({
          price: Number(d.askPrice),
          change: 0,
          high: 0,
          low: 0,
          volume: 0,
        });
      }

      // TRADES
      if (msg.c.includes("deal")) {
        if (Array.isArray(msg.d)) {
          msg.d.forEach((t: any) => {
            useMarketDataStore.getState().pushTrade({
              price: Number(t.p),
              volume: Number(t.v),
              ts: t.t,
              side: t.S === "buy" ? "buy" : "sell",
            });
          });
        }
      }

      // DEPTH
      if (msg.c.includes("depth")) {
        const d = msg.d;
        if (!!d?.bids && !!d?.asks) {
          useMarketDataStore.getState().setDepth(d.bids, d.asks);
        }
      }
    };

    this.ws.onerror = () => {
      // Do not spam reconnect attempts inside Firebase Studio
      useMarketDataStore.getState().setError("WS error detected");
    };

    this.ws.onclose = (ev) => {
      useMarketDataStore.getState().setConnected(false);

      // Firebase Studio 1006 → BLOCKED → use fallback
      if (ev.code === 1006) {
        this.startPollingFallback();
        return;
      }

      // Other abnormal closures → reconnect
      if (!this.killed) this.reconnect();
    };
  }

  private reconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * this.reconnectAttempts, 10_000);

    setTimeout(() => {
      this.reconnecting = false;
      this.connect();
    }, delay);
  }

  /** 🔥 Fallback for Firebase Studio where WS does not work */
  private startPollingFallback() {
    const safeSymbol = this.symbol.replace("-", "").toUpperCase();

    const poll = async () => {
      if (this.killed) return;

      try {
        // MEXC REST Snapshot
        const depth = await fetch(
          `https://api.mexc.com/api/v3/depth?symbol=${safeSymbol}&limit=100`
        ).then((r) => r.json());

        useMarketDataStore
          .getState()
          .setDepth(depth.bids ?? [], depth.asks ?? []);
      } catch {}

      setTimeout(poll, 1500);
    };

    poll();
  }

  kill() {
    this.killed = true;
    this.ws?.close();
    this.ws = null;
  }
}
