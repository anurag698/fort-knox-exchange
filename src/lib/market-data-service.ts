
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
  pushTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades].slice(-100) })),
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
  private reconnectAttempts: number = 0;

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
    if (this.ws) {
        this.disconnect(true); // silent disconnect for a clean state
    }
    
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
      this.reconnectAttempts = 0; // Reset on successful connection
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
      
      // Abnormal closure, likely due to sandbox or network issue
      if (event.code === 1006) {
        useMarketDataStore.getState().setError("Connection failed. The development environment may be blocking WebSockets. Please test in a standard browser window.");
        // Do not attempt to reconnect in a loop if it's a sandbox issue
        return;
      }
      
      if (event.code !== 1000) { // Don't reconnect on normal closure
        this.reconnect();
      }
    };
  }

  private reconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff up to 30s
    console.log(`WebSocket disconnected. Attempting to reconnect in ${delay / 1000}s...`);
    setTimeout(() => this.connect(), delay);
  }

  private subscribe() {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const subscriptionMessage = {
      method: "SUBSCRIPTION",
      params: [
        `spot@public.bookTicker.v3.api@${this.symbol}`,
        `spot@public.deal.v3.api@${this.symbol}`,
        `spot@public.kline.v3.api@${this.symbol}@Min1`,
        `spot@public.depth.v3.api@${this.symbol}@0`,
      ],
      id: 1,
    };
    this.ws.send(JSON.stringify(subscriptionMessage));
  }

  private handleMessage(rawMessage: string) {
    const message = JSON.parse(rawMessage);

    if (message.c) { // Channel-based message
        if (message.c.includes('spot@public.bookTicker.v3.api')) {
            const d = message.d;
            const adaptedTicker = {
                c: d.askPrice,
                P: '0.0', // Not provided by this stream, would need another source
                h: '0',     // Not provided
                l: '0',     // Not provided
                v: '0',     // Not provided
                s: d.symbol
            };
            useMarketDataStore.getState().setTicker(adaptedTicker);

        } else if (message.c.includes('spot@public.deal.v3.api')) {
            // Corrected: MEXC sends an array directly in `d`
            if (Array.isArray(message.d)) {
                message.d.forEach((trade: any) => {
                    const adaptedTrade = { p: trade.p, q: trade.v, T: trade.t, m: trade.S === 'sell' };
                    useMarketDataStore.getState().pushTrade(adaptedTrade);
                });
            }
        } else if (message.c.includes('spot@public.depth.v3.api')) {
            if (message.d?.bids && message.d?.asks) {
                 useMarketDataStore.getState().setDepth(message.d.bids, message.d.asks);
            }
        }
    }
  }

  disconnect(isInternalCall = false) {
    if (this.ws) {
        if (!isInternalCall) {
            console.log("Disconnecting from MEXC WebSocket.");
        }
        this.ws.close(1000, "User-initiated disconnect");
        this.ws = null;
    }
    useMarketDataStore.getState().setConnected(false);
  }
}

export const marketDataService = MarketDataService;
