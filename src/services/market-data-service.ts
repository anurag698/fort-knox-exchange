"use client";

import { marketDataStore } from "@/state/market-data-store";
import { ChartEventBus } from "@/components/trade/chart/chart-event-bus"; 

// --------------------------------------------------
// FIXED SINGLETON + CORRECT EXPORT SHAPE
// --------------------------------------------------

class _MarketDataService {
  private ws: WebSocket | null = null;
  private symbol: string = "";
  private reconnectTimer: any = null;

  connect(symbol: string) {
    this.symbol = symbol.replace("-", "").toUpperCase();

    // Close existing connection
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }

    const url = "wss://wbs.mexc.com/ws";

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      console.error("WS creation failed:", err);
      marketDataStore.setState({ error: "WebSocket creation failed" });
      return;
    }

    this.ws.onopen = () => {
      console.log("MEXC WS connected:", this.symbol);

      marketDataStore.setState({ isConnected: true, error: null });

      this.subscribe();
    };

    this.ws.onmessage = (msg) => {
      this.handleMessage(msg.data);
    };

    this.ws.onerror = (e) => {
      console.error("WS error:", e);
      marketDataStore.setState({ error: "WebSocket error" });
    };

    this.ws.onclose = (event) => {
      console.warn("WS closed:", event.code, event.reason);
      marketDataStore.setState({ isConnected: false });

      if (event.code === 1006) {
        // Firebase Studio sandbox block
        marketDataStore.setState({
          error: "WS blocked by Firebase Preview — test on localhost or live hosting.",
        });
        return;
      }

      // Attempt reconnect
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.connect(symbol);
        }, 3000);
      }
    };
  }

  subscribe() {
    if (!this.ws || this.ws.readyState !== 1) return;

    const msg = {
      method: "SUBSCRIPTION",
      params: [
        `spot@public.bookTicker.v3.api@${this.symbol}`,
        `spot@public.deal.v3.api@${this.symbol}`,
        `spot@public.kline.v3.api@${this.symbol}@Min1`,
        `spot@public.depth.v3.api@${this.symbol}@0`,
      ],
      id: 1,
    };

    this.ws.send(JSON.stringify(msg));
  }

  handleMessage(raw: string) {
    let msg: any = null;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (!msg.c) return;

    // ---------------- 1) TICKER ----------------
    if (msg.c.includes("bookTicker")) {
      const d = msg.d;
      const ticker = {
        price: parseFloat(d.a), // Use ask price for ticker
        change: 0, // Not provided in this stream, would need another
        high: 0,
        low: 0,
        volume: 0,
        s: d.s,
      };
      marketDataStore.setState({ ticker });

      // Forward to chart overlays
      ChartEventBus.emit("ticker", ticker);
      return;
    }

    // ---------------- 2) TRADES ----------------
    if (msg.c.includes("deal")) {
      if (Array.isArray(msg.d?.d)) {
        msg.d.d.forEach((t: any) => {
          const trade = {
            p: t.p,
            q: t.v,
            T: t.t,
            m: t.S === 2, // 1 for BUY, 2 for SELL in this payload
          };

          marketDataStore.getState().pushTrade(trade);

          // Forward to chart trade markers
          ChartEventBus.emit("trade", trade);
        });
      }
      return;
    }

    // ---------------- 3) DEPTH ----------------
    if (msg.c.includes("depth")) {
      const { bids, asks } = msg.d || {};
      if (bids && asks) {
        marketDataStore.getState().setDepth(bids, asks);

        // Forward to heatmap
        ChartEventBus.emit("depth", { bids, asks });
      }
      return;
    }

    // ---------------- 4) KLINE ----------------
    if (msg.c.includes("kline")) {
      const k = msg.d?.k;
      if (!k) return;

      const candle = {
        t: k.t * 1000, // convert to ms
        o: k.o,
        h: k.h,
        l: k.l,
        c: k.c,
        v: k.v,
      };

      // Send to the Unified Chart Engine
      ChartEventBus.emit("kline", candle);
      return;
    }
  }

  kill() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;

    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }

    marketDataStore.setState({ isConnected: false });
  }
}

// --------------------------------------------------
// CORRECTED EXPORT — FIXES .get() ERROR
// --------------------------------------------------

export const marketDataService = new _MarketDataService();
