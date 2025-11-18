// ===========================================================
//  Fort Knox Exchange — PRO Market Data Engine (Binance Spot)
// ===========================================================

'use client';

import { create } from 'zustand';

// ------------------------------
// Zustand store for live updates
// ------------------------------
interface MarketDataState {
  ticker: any | null;
  depth: { bids: any[]; asks: any[] };
  trades: any[];
  klines: any[];
  setTicker: (data: any) => void;
  setDepth: (bids: any[], asks: any[]) => void;
  setTrades: (t: any[]) => void;
  setKlines: (k: any[]) => void;
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
  ticker: null,
  depth: { bids: [], asks: [] },
  trades: [],
  klines: [],

  setTicker: (data) => set({ ticker: data }),
  setDepth: (bids, asks) => set({ depth: { bids, asks } }),
  setTrades: (t) => set({ trades: t }),
  setKlines: (k) => set({ klines: k }),
}));

// ------------------------------
// Binance WS URLs
// ------------------------------
function streamUrl(symbol: string, stream: string) {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@${stream}`;
}

// ------------------------------
// MarketDataService (singleton)
// ------------------------------
export class MarketDataService {
  private static instances: Map<string, MarketDataService> = new Map();

  private symbol: string;
  private sockets: WebSocket[] = [];

  private constructor(symbol: string) {
    this.symbol = symbol;
  }

  // ---------------------------------------------------------
  // Singleton access for each symbol (BTCUSDT, ETHUSDT, etc.)
  // ---------------------------------------------------------
  static get(symbol: string) {
    if (!this.instances.has(symbol)) {
      this.instances.set(symbol, new MarketDataService(symbol));
    }
    return this.instances.get(symbol)!;
  }

  // ---------------------------------------------------------
  // Connect all Binance streams needed for PRO terminal
  // ---------------------------------------------------------
  connect() {
    this.disconnect(); // clean old sockets

    this.openTicker();
    this.openDepth();
    this.openTrades();
    this.openKline('1m');
  }

  // ---------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------
  disconnect() {
    this.sockets.forEach((ws) => ws.close());
    this.sockets = [];
  }

  // ---------------------------------------------------------
  // WebSocket helpers
  // ---------------------------------------------------------
  private createSocket(url: string, onMessage: (d: any) => void) {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[WS OPEN]', url);
    };

    ws.onerror = (err) => {
      console.error('[WS ERROR]', url, err);
    };

    ws.onclose = () => {
      console.warn('[WS CLOSED — Reconnecting]', url);
      setTimeout(() => this.createSocket(url, onMessage), 1500);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        onMessage(data);
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    this.sockets.push(ws);
    return ws;
  }

  // ---------------------------------------------------------
  // STREAM: Ticker
  // ---------------------------------------------------------
  private openTicker() {
    const url = streamUrl(this.symbol, 'ticker');
    this.createSocket(url, (d) => {
      useMarketDataStore.getState().setTicker(d);
    });
  }

  // ---------------------------------------------------------
  // STREAM: Depth
  // ---------------------------------------------------------
  private openDepth() {
    const url = streamUrl(this.symbol, 'depth20@100ms');
    this.createSocket(url, (d) => {
      useMarketDataStore
        .getState()
        .setDepth(d.bids ?? [], d.asks ?? []);
    });
  }

  // ---------------------------------------------------------
  // STREAM: Trades
  // ---------------------------------------------------------
  private openTrades() {
    const url = streamUrl(this.symbol, 'trade');
    this.createSocket(url, (d) => {
      const store = useMarketDataStore.getState();
      const updated = [...store.trades, d].slice(-60); // keep last 60
      store.setTrades(updated);
    });
  }

  // ---------------------------------------------------------
  // STREAM: Kline (interval)
  // ---------------------------------------------------------
  private openKline(interval: string) {
    const url = streamUrl(this.symbol, `kline_${interval}`);
    this.createSocket(url, (d) => {
      const candle = d.k;
      const bar = {
        time: candle.t / 1000,
        open: Number(candle.o),
        high: Number(candle.h),
        low: Number(candle.l),
        close: Number(candle.c),
      };

      const store = useMarketDataStore.getState();
      const updated = [...store.klines.filter((k) => k.time !== bar.time), bar];
      store.setKlines(updated);
    });
  }
}
