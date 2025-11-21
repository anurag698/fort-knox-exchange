
// src/services/market-data-service.ts
/**
 * MarketDataService
 * - Provides: startFeed(symbol, interval) and stopFeed()
 * - Normalizes messages to Candle / Trade / Depth / Ticker and emits on bus
 * - Defensive (safeWsSend), sandbox detection, reconnect/backoff
 *
 * Usage:
 *  import MarketDataService from "@/services/market-data-service";
 *  MarketDataService.startFeed("BTCUSDT", "1m");
 *  MarketDataService.stopFeed();
 */

import { parseNumber, Candle, Trade, Depth, Ticker, SymbolId } from "@/lib/market-types";
import { bus } from "@/components/bus";

type FeedKey = `${SymbolId}@${string}`; // e.g. BTCUSDT@1m

class MarketDataServiceClass {
  private ws: WebSocket | null = null;
  private url = "wss://wbs.mexc.com/ws";
  private reconnectAttempts = 0;
  private feedSymbol: SymbolId | null = null;
  private feedInterval: string | null = null;
  private isSandbox: boolean = typeof window !== "undefined" && window.location.href.includes("firebase");
  private reconnectTimer: number | null = null;

  // ensure singleton-style .get() compatibility if older code still calls it
  static get(symbol?: string) {
    // return the singleton instance (ignore symbol param)
    return MarketDataService;
  }

  // safe send that queues until open if needed
  private safeWsSend = (msg: any) => {
    try {
      if (!this.ws) return;
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }
      const onOpen = () => {
        try {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
          }
        } catch (e) {
          // ignore send failures
        } finally {
          this.ws?.removeEventListener("open", onOpen);
        }
      };
      this.ws.addEventListener("open", onOpen);
    } catch (e) {
      // swallow - noncritical
      console.warn("safeWsSend error", e);
    }
  };

  private connectSocket = () => {
    // if sandbox, don't attempt to connect in the studio preview (it will 1006 / 1008)
    if (this.isSandbox) {
      console.warn("[MarketDataService] Firebase Studio detected — using offline simulation only.");
      this.emitStatus("sandbox");
      return;
    }

    // already connected?
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.error("[MarketDataService] WebSocket creation failed", e);
      this.emitStatus("error");
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emitStatus("connected");
      // subscribe if feedSymbol is set
      if (this.feedSymbol && this.feedInterval) this.subscribeToFeeds();
    };

    this.ws.onerror = (ev: Event) => {
      try {
        const info = (ev as any)?.message ?? JSON.stringify(ev);
        console.warn("[MarketDataService] ws error:", info);
      } catch {
        console.warn("[MarketDataService] ws error (unknown)");
      }
      this.emitStatus("ws-error");
    };

    this.ws.onclose = (ev) => {
      console.warn("[MarketDataService] ws closed", ev.code, ev.reason);
      this.emitStatus("disconnected");
      if (ev.code === 1006) {
        // sandbox / disallowed environment - do not reconnect aggressively
        return;
      }
      // attempt reconnect with exponential backoff
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
      if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = window.setTimeout(() => this.connectSocket(), delay) as unknown as number;
    };

    this.ws.onmessage = (ev) => {
      try {
        this.handleRawMessage(ev.data);
      } catch (e) {
        // don't crash on parse issues
        if (process.env.NODE_ENV === "development") console.warn("[MarketDataService] parse error", e);
      }
    };
  };

  private emitStatus(status: string) {
    try {
      bus.emit?.("market-feed:status", { status, symbol: this.feedSymbol, interval: this.feedInterval });
    } catch { }
  }

  /**
   * message normalization
   * This method needs to be resilient: MEXC messages contain many structures; we normalize the important ones.
   */
  private handleRawMessage(raw: any) {
    if (!raw) return;
    let msg: any;
    try {
      msg = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return;
    }

    // MEXC uses a 'c' channel field for typed messages
    // Example: { c: 'spot@public.kline.v3.api', d: { ... } }
    if (msg.c && typeof msg.c === "string") {
      const ch = msg.c as string;
      if (ch.includes("kline")) {
        // msg.d often contains kline data
        const d = msg.d;
        if (!d) return;
        // adapt MEXC kline (may be single or array)
        // When MEXC provides 'd' object with keys like ts, o, h, l, c, v
        const candle: Candle = {
          t: parseNumber(d?.ts) || Date.now(),
          o: parseNumber(d?.o),
          h: parseNumber(d?.h),
          l: parseNumber(d?.l),
          c: parseNumber(d?.c),
          v: parseNumber(d?.v),
          final: Boolean(d?.e === "kline_end" || d?.final),
        };
        bus.emit?.("kline", { symbol: this.feedSymbol, interval: this.feedInterval, candle });
        return;
      } else if (ch.includes("deal") || ch.includes("trade")) {
        // trades: msg.d may be { d: [ { p, v, t, S } ] } or similar
        const d = msg.d;
        const tradesArr = Array.isArray(d?.d) ? d.d : (Array.isArray(d) ? d : null);
        if (Array.isArray(tradesArr)) {
          for (const rawTrade of tradesArr) {
            const t: Trade = {
              id: rawTrade?.id ?? rawTrade?.t ?? undefined,
              p: parseNumber(rawTrade?.p ?? rawTrade?.price),
              q: parseNumber(rawTrade?.v ?? rawTrade?.quantity ?? rawTrade?.q),
              ts: parseNumber(rawTrade?.t ?? rawTrade?.ts ?? Date.now()),
              side: (rawTrade?.S === "sell" || rawTrade?.side === "sell") ? "sell" : "buy",
            };
            bus.emit?.("trade", { symbol: this.feedSymbol, trade: t });
          }
        }
        return;
      } else if (ch.includes("depth") || ch.includes("bookTicker") || ch.includes("book")) {
        // depth update
        const d = msg.d;
        if (d?.bids && d?.asks) {
          const bids = Array.isArray(d.bids) ? d.bids.map((b: any) => ({ price: parseNumber(b[0] ?? b.price ?? b.p), size: parseNumber(b[1] ?? b.size ?? b.q) })) : [];
          const asks = Array.isArray(d.asks) ? d.asks.map((a: any) => ({ price: parseNumber(a[0] ?? a.price ?? a.p), size: parseNumber(a[1] ?? a.size ?? a.q) })) : [];
          const mid = (bids[0]?.price && asks[0]?.price) ? (bids[0].price + asks[0].price) / 2 : undefined;
          const depth: Depth = { bids, asks, ts: parseNumber(d?.ts ?? Date.now()), mid };
          bus.emit?.("depth", { symbol: this.feedSymbol, depth });
        } else if (d?.askPrice || d?.bidPrice) {
          // bookTicker style
          const ticker: Ticker = {
            symbol: d?.symbol ?? this.feedSymbol ?? "UNKNOWN",
            askPrice: parseNumber(d?.askPrice ?? d?.a),
            bidPrice: parseNumber(d?.bidPrice ?? d?.b),
            lastPrice: parseNumber(d?.c ?? d?.lastPrice),
            ts: parseNumber(d?.ts ?? Date.now()),
          };
          bus.emit?.("ticker", { symbol: this.feedSymbol, ticker });
        }
        return;
      }
    }

    // Some services send Binance-like events (e.g., kline object under 'k' or 'candle')
    if (msg.k || msg.candle) {
      const k = msg.k ?? msg.candle;
      const candle: Candle = {
        t: parseNumber(k.t ?? k.startTime ?? Date.now()),
        o: parseNumber(k.o ?? k.open),
        h: parseNumber(k.h ?? k.high),
        l: parseNumber(k.l ?? k.low),
        c: parseNumber(k.c ?? k.close),
        v: parseNumber(k.v ?? k.volume),
        final: Boolean(k.x ?? k.isFinal ?? k.final),
      };
      bus.emit?.("kline", { symbol: this.feedSymbol, interval: this.feedInterval, candle });
      return;
    }

    // fallback: if message contains price/ticker-ish fields, emit ticker
    if (msg.p || msg.price || msg.lastPrice) {
      const ticker: Ticker = {
        symbol: this.feedSymbol ?? (msg.s ?? "UNKNOWN"),
        lastPrice: parseNumber(msg.p ?? msg.price ?? msg.lastPrice),
        bidPrice: parseNumber(msg.b ?? msg.bidPrice),
        askPrice: parseNumber(msg.a ?? msg.askPrice),
        ts: Date.now(),
      };
      bus.emit?.("ticker", { symbol: this.feedSymbol, ticker });
      return;
    }

    // otherwise ignore unknown messages
  }

  private subscribeToFeeds = () => {
    if (!this.feedSymbol || !this.feedInterval) return;
    if (!this.ws) return;

    // Map intervals to MEXC format
    const intervalMap: Record<string, string> = {
      "1m": "Min1",
      "5m": "Min5",
      "15m": "Min15",
      "30m": "Min30",
      "1H": "Hour1",
      "4H": "Hour4",
      "1D": "Day1",
    };

    const mexcInterval = intervalMap[this.feedInterval] || "Min1";
    // console.log(`📡 Subscribing to MEXC feeds for ${this.feedSymbol} @ ${mexcInterval}`);

    // MEXC subscription format
    const sub = {
      method: "SUBSCRIPTION",
      params: [
        `spot@public.kline.v3.api@${this.feedSymbol}@${mexcInterval}`,
        `spot@public.deal.v3.api@${this.feedSymbol}`,
        `spot@public.depth.v3.api@${this.feedSymbol}@0`,
        `spot@public.bookTicker.v3.api@${this.feedSymbol}`,
      ],
      id: 1,
    };
    this.safeWsSend(sub);
  };

  /**
   * Public API
   */
  public startFeed = (symbol: string, interval: string = "1m") => {
    const normalized = (symbol ?? "").replace("-", "").toUpperCase();
    const changed = this.feedSymbol !== normalized || this.feedInterval !== interval;

    // If feed changed, unsubscribe from old feeds first
    if (changed && this.feedSymbol && this.feedInterval && this.ws && this.ws.readyState === WebSocket.OPEN) {
      // console.log(`🔄 Changing feed from ${this.feedSymbol}@${this.feedInterval} to ${normalized}@${interval}`);

      // Unsubscribe from old feeds
      const oldIntervalMap: Record<string, string> = {
        "1m": "Min1",
        "5m": "Min5",
        "15m": "Min15",
        "30m": "Min30",
        "1H": "Hour1",
        "4H": "Hour4",
        "1D": "Day1",
      };

      const oldMexcInterval = oldIntervalMap[this.feedInterval] || "Min1";
      const unsub = {
        method: "UNSUBSCRIPTION",
        params: [
          `spot@public.kline.v3.api@${this.feedSymbol}@${oldMexcInterval}`,
          `spot@public.deal.v3.api@${this.feedSymbol}`,
          `spot@public.depth.v3.api@${this.feedSymbol}@0`,
          `spot@public.bookTicker.v3.api@${this.feedSymbol}`,
        ],
        id: 2,
      };
      this.safeWsSend(unsub);
    }

    this.feedSymbol = normalized as SymbolId;
    this.feedInterval = interval;

    // connect socket if needed and subscribe
    this.connectSocket();
    // if connected immediately, subscribe
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Small delay to ensure unsubscribe completes first
      setTimeout(() => this.subscribeToFeeds(), 100);
    }
    this.emitStatus("started");
  };

  public stopFeed = () => {
    this.feedSymbol = null;
    this.feedInterval = null;
    if (this.ws) {
      try {
        this.ws.close(1000, "stopFeed");
      } catch { }
      this.ws = null;
    }
    this.emitStatus("stopped");
  };
}

export const MarketDataService = new MarketDataServiceClass();
// maintain default compatibility with `import MarketDataService from ...`
export default MarketDataService;
