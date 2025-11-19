// ======================================================
// MEXC Live WebSocket Stream Manager
// For: ticker, depth, kline, trades
// ======================================================

"use client";

import { getMarket } from "@/lib/market/market-config";

export interface MEXCStreamHandlers {
  onTicker?: (data: any) => void;
  onDepth?: (data: any) => void;
  onKline?: (data: any) => void;
  onTrade?: (data: any) => void;
  onError?: (err: any) => void;
}

export class MEXCStream {
  private ws: WebSocket | null = null;
  private symbol: string;
  private handlers: MEXCStreamHandlers;

  constructor(symbol: string, handlers: MEXCStreamHandlers) {
    this.symbol = symbol;
    this.handlers = handlers;
  }

  connect() {
    // Firebase Studio sandbox fails with ws:// → always use wss://
    const url = "wss://wbs.mexc.com/ws";

    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.error("WebSocket creation failed:", e);
      this.handlers.onError?.("WS_CREATION_FAILED");
      return;
    }

    this.ws.onopen = () => {
      this.subscribe();
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        this.routeMessage(msg);
      } catch (e) {
        console.warn("WS parse error", e);
      }
    };

    this.ws.onerror = (e) => {
      this.handlers.onError?.(e);
    };

    this.ws.onclose = (ev) => {
      console.warn("MEXC WS closed", ev.code, ev.reason);
    };
  }

  // ------------------------------------------------------
  // SUBSCRIPTION
  // ------------------------------------------------------
  private subscribe() {
    if (!this.ws) return;

    const symbol = this.symbol.toUpperCase();

    const payload = {
      method: "SUBSCRIPTION",
      params: [
        `spot@public.bookTicker.v3.api@${symbol}`,
        `spot@public.depth.v3.api@${symbol}@0`,
        `spot@public.deal.v3.api@${symbol}`,
        `spot@public.kline.v3.api@${symbol}@Min1`,
      ],
      id: 1,
    };

    try {
      this.ws.send(JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to subscribe:", e);
    }
  }

  // ------------------------------------------------------
  // MESSAGE ROUTING
  // ------------------------------------------------------
  private routeMessage(msg: any) {
    if (!msg?.c) return;

    if (msg.c.includes("bookTicker")) {
      this.handlers.onTicker?.(msg.d);
    }

    if (msg.c.includes("depth")) {
      this.handlers.onDepth?.(msg.d);
    }

    if (msg.c.includes("deal")) {
      if (Array.isArray(msg.d)) {
        this.handlers.onTrade?.(msg.d);
      }
    }

    if (msg.c.includes("kline")) {
      if (msg.d?.kline) {
        this.handlers.onKline?.(msg.d.kline);
      }
    }
  }

  disconnect() {
    try {
      this.ws?.close(1000, "manual disconnect");
    } catch (_) {}
    this.ws = null;
  }
}
