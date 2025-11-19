
'use client';

import { create } from 'zustand';

// ------------------------------
// Types for MEXC
// ------------------------------
export type TickerData = {
  symbol: string;
  bidPrice: string;
  askPrice: string;
};

export type TradeData = {
  p: string; // price
  v: string; // volume
  T: number; // timestamp
  S: 'buy' | 'sell'; // side
};

export type KlineData = {
    i: string; // interval
    ts: number; // timestamp
    o: string; // open
    h: string; // high
    l: string; // low
    c: string; // close
    v: string; // volume
};

export type RawOrder = [string, string]; // [price, size]

export type ProcessedOrder = {
  price: number;
  size: number;
  isWall: boolean;
};

// ------------------------------
// Zustand store for live updates
// ------------------------------
interface MarketDataState {
  ticker: { c: string; P: string; h: string; l: string; v: string; s: string } | null;
  bids: ProcessedOrder[];
  asks: ProcessedOrder[];
  trades: any[];
  isConnected: boolean;
  error: string | null;
  hoveredPrice: number | null;
  setTicker: (data: any) => void;
  setDepth: (bids: RawOrder[], asks: RawOrder[]) => void;
  pushTrade: (trade: any) => void;
  setConnected: (status: boolean) => void;
  setError: (error: string | null) => void;
  setHoveredPrice: (price: number | null) => void;
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
    function detectWalls(levels: RawOrder[]): ProcessedOrder[] {
        if (!Array.isArray(levels) || levels.length === 0) return [];

        const top15Levels = levels.slice(0, 15);
        const amounts = top15Levels.map((lvl) => parseFloat(lvl[1]) || 0);
        const avg = amounts.reduce((a, b) => a + b, 0) / (amounts.length || 1);
        const threshold = avg * 2.5;

        return levels.map((lvl) => {
            const price = parseFloat(lvl[0]);
            const size = parseFloat(lvl[1]);
            return { price, size, isWall: size >= threshold };
        });
    }
    const processedBids = detectWalls(bids);
    const processedAsks = detectWalls(asks);
    set({ bids: processedBids, asks: processedAsks });
  },
  pushTrade: (trade) => set((state) => ({ trades: [...state.trades, trade].slice(-100) })),
  setConnected: (status) => set({ isConnected: status }),
  setError: (error) => set({ error }),
  setHoveredPrice: (price) => set({ hoveredPrice: price }),
}));


// ------------------------------
// MarketDataService (singleton)
// ------------------------------
export class MarketDataService {
  private static instances: Map<string, MarketDataService> = new Map();

  private symbol: string;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor(symbol: string) {
    this.symbol = symbol.replace('-', '').toUpperCase();
  }

  static get(symbol: string) {
    if (!this.instances.has(symbol)) {
      this.instances.set(symbol, new MarketDataService(symbol));
    }
    return this.instances.get(symbol)!;
  }

  connect() {
    this.disconnect(); // Ensure no existing connection
    const url = "wss://wbs.mexc.com/ws";
    
    try {
        this.ws = new WebSocket(url);
    } catch(e) {
        console.error("WebSocket creation failed:", e);
        useMarketDataStore.getState().setError("WebSocket connection failed.");
        return;
    }

    this.ws.onopen = () => {
      console.log("MEXC WebSocket connected");
      useMarketDataStore.getState().setConnected(true);
      useMarketDataStore.getState().setError(null);
      this.subscribe();
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = (err) => {
      console.error('MEXC WebSocket error:', err);
    };

    this.ws.onclose = (event) => {
      console.log('MEXC WebSocket closed:', event.code, event.reason);
      useMarketDataStore.getState().setConnected(false);
      // Don't auto-reconnect on normal close or if already handling it
      if (event.code !== 1000 && !this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => this.connect(), 5000); // Reconnect after 5s
      }
    };
  }

  private subscribe() {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const subscriptionMessage = {
      method: "SUBSCRIPTION",
      params: [
        `spot@public.bookTicker.v3.api@${this.symbol}`,
        `spot@public.deal.v3.api@${this.symbol}`,
        `spot@public.kline.v3.api@${this.symbol}@Min1`,
        `spot@public.depth.v3.api@${this.symbol}`,
      ],
      id: 1,
    };
    this.ws.send(JSON.stringify(subscriptionMessage));
  }

  private handleMessage(rawMessage: string) {
    const message = JSON.parse(rawMessage);

    if (message.c) {
      if (message.c.includes('spot@public.bookTicker.v3.api')) {
        const d = message.d;
        // Adapt to the old TickerData structure for now
        const adaptedTicker = {
          c: d.askPrice,
          P: '0.0',
          h: '0',
          l: '0',
          v: '0',
          s: d.symbol
        };
        useMarketDataStore.getState().setTicker(adaptedTicker);
      } else if (message.c.includes('spot@public.deal.v3.api')) {
        const d = message.d;
        // Adapt to old trade format
        const adaptedTrade = { p: d.p, q: d.v, T: d.T, m: d.S === 'sell' };
        useMarketDataStore.getState().pushTrade(adaptedTrade);
      } else if (message.c.includes('spot@public.depth.v3.api')) {
          if (message.d?.bids && message.d?.asks) {
              useMarketDataStore.getState().setDepth(message.d.bids, message.d.asks);
          }
      }
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, "Component unmounted or explicit disconnect");
      this.ws = null;
    }
    useMarketDataStore.getState().setConnected(false);
  }

   public subscribeToTickers(symbols: string[]) {
    // This is now handled by the main `connect` method per-market
    // but we can leave a stub here for components that might use it
  }

  public unsubscribeFromTickers(symbols: string[]) {
    // Also handled by `disconnect`
  }
}

export const marketDataService = MarketDataService;

    