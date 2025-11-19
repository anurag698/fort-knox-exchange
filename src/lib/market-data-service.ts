
'use client';

import { create } from 'zustand';

// =====================================================
//  Types (MEXC formats)
// =====================================================

export type RawOrder = [string, string];

export type ProcessedOrder = {
  price: number;
  size: number;
  isWall: boolean;
};

// =====================================================
//  Zustand store
// =====================================================

interface MarketDataState {
  ticker: any | null;
  bids: ProcessedOrder[];
  asks: ProcessedOrder[];
  trades: any[];
  isConnected: boolean;
  error: string | null;
  hoveredPrice: number | null;

  setTicker: (data: any) => void;
  setDepth: (bids: RawOrder[], asks: RawOrder[]) => void;
  pushTrade: (trade: any) => void;
  setConnected: (s: boolean) => void;
  setError: (e: string | null) => void;
  setHoveredPrice: (p: number | null) => void;
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
  ticker: null,
  bids: [],
  asks: [],
  trades: [],
  isConnected: false,
  error: null,
  hoveredPrice: null,

  setTicker: (data) => set({ ticker: data }),

  setDepth: (bids, asks) => {
    const detect = (levels: RawOrder[]): ProcessedOrder[] => {
      if (!Array.isArray(levels) || levels.length === 0) return [];
      const top = levels.slice(0, 15);
      const avg = top.reduce((a, b) => a + parseFloat(b[1]), 0) / top.length;
      const th = avg * 2.5;
      return levels.map(([p, s]) => ({
        price: +p,
        size: +s,
        isWall: +s >= th,
      }));
    };
    set({ bids: detect(bids), asks: detect(asks) });
  },

  pushTrade: (t) =>
    set((st) => ({ trades: [t, ...st.trades].slice(0, 200) })),

  setConnected: (s) => set({ isConnected: s }),
  setError: (e) => set({ error: e }),
  setHoveredPrice: (p) => set({ hoveredPrice: p }),
}));

// =====================================================
//  MarketDataService (Singleton)
// =====================================================

export class MarketDataService {
  private static instances = new Map<string, MarketDataService>();
  private ws: WebSocket | null = null;
  private symbol: string;
  private reconnectAttempts = 0;
  private heartbeat: NodeJS.Timeout | null = null;

  private constructor(symbol: string) {
    this.symbol = symbol.replace('-', '').toUpperCase();
  }

  static get(symbol: string) {
    if (!this.instances.has(symbol)) {
      this.instances.set(symbol, new MarketDataService(symbol));
    }
    return this.instances.get(symbol)!;
  }

  // -----------------------------------------------------
  //  Connect
  // -----------------------------------------------------
  connect() {
    this.disconnect(true);

    const url = 'wss://wbs.mexc.com/ws';

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      useMarketDataStore.getState().setError('WS creation failed.');
      return;
    }

    this.ws.onopen = () => {
      useMarketDataStore.getState().setConnected(true);
      useMarketDataStore.getState().setError(null);
      this.reconnectAttempts = 0;

      this.subscribe();
      this.startHeartbeat();
    };

    this.ws.onmessage = (e) => this.handleMessage(e.data);

    this.ws.onerror = (err) => {
      console.error('WS error:', err);
    };

    this.ws.onclose = (e) => {
      this.stopHeartbeat();
      useMarketDataStore.getState().setConnected(false);

      // Firebase Studio always triggers 1006/1008
      if (e.code === 1006) {
        useMarketDataStore.getState().setError(
          'WebSocket blocked by Firebase Studio preview. Test in a normal browser.'
        );
        return;
      }

      if (e.code !== 1000) this.reconnect();
    };
  }

  // -----------------------------------------------------
  //  Heartbeat (keeps connection alive)
  // -----------------------------------------------------
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'PING' }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
  }

  // -----------------------------------------------------
  //  Reconnect with backoff
  // -----------------------------------------------------
  private reconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(500 * 2 ** this.reconnectAttempts, 20000);
    setTimeout(() => this.connect(), delay);
  }

  // -----------------------------------------------------
  //  Subscription
  // -----------------------------------------------------
  private subscribe() {
    if (this.ws?.readyState !== 1) return;

    const sub = {
      method: 'SUBSCRIPTION',
      params: [
        `spot@public.bookTicker.v3.api@${this.symbol}`,
        `spot@public.deal.v3.api@${this.symbol}`,
        `spot@public.kline.v3.api@${this.symbol}@Min1`,
        `spot@public.depth.v3.api@${this.symbol}@0`,
      ],
      id: 1,
    };

    this.ws.send(JSON.stringify(sub));
  }

  // -----------------------------------------------------
  //  Message Handling
  // -----------------------------------------------------
  private handleMessage(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (!msg.c) return;

    // ---------------------- Ticker ----------------------
    if (msg.c.includes('bookTicker')) {
      const d = msg.d;
      useMarketDataStore.getState().setTicker({
        c: d.askPrice,
        P: '0',
        h: '0',
        l: '0',
        v: '0',
        s: d.symbol,
      });
      return;
    }

    // ---------------------- Trades ----------------------
    if (msg.c.includes('deal')) {
      if (Array.isArray(msg.d)) {
        for (const t of msg.d) {
          useMarketDataStore.getState().pushTrade({
            p: t.p,
            q: t.v,
            T: t.t,
            m: t.S === 'sell',
          });
        }
      }
      return;
    }

    // ---------------------- Depth -----------------------
    if (msg.c.includes('depth')) {
      if (msg.d?.bids && msg.d?.asks) {
        useMarketDataStore.getState().setDepth(msg.d.bids, msg.d.asks);
      }
      return;
    }
  }

  // -----------------------------------------------------
  //  Disconnect
  // -----------------------------------------------------
  disconnect(silent = false) {
    this.stopHeartbeat();

    if (this.ws) {
      if (!silent) console.log('Disconnecting WS...');
      this.ws.close(1000, 'clean disconnect');
      this.ws = null;
    }
    useMarketDataStore.getState().setConnected(false);
  }
}

export const marketDataService = MarketDataService;
