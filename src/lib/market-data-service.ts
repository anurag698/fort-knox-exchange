
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
  isConnected: boolean;
  error: string | null;
  setTicker: (data: any) => void;
  setDepth: (bids: any[], asks: any[]) => void;
  setTrades: (t: any[]) => void;
  pushTrade: (trade: any) => void;
  setKlines: (k: any[]) => void;
  pushKline: (kline: any) => void;
  setConnected: (status: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
  ticker: null,
  depth: { bids: [], asks: [] },
  trades: [],
  klines: [],
  isConnected: false,
  error: null,
  setTicker: (data) => set({ ticker: data }),
  setDepth: (bids, asks) => set((state) => {
    // Optimization: avoid re-render if data is identical
    if (state.depth.bids === bids && state.depth.asks === asks) return state;
    return { depth: { bids, asks } };
  }),
  setTrades: (t) => set({ trades: t }),
  pushTrade: (trade) => set((state) => ({
    trades: [...state.trades, trade].slice(-100) // Keep last 100 trades
  })),
  setKlines: (k) => set({ klines: k }),
  pushKline: (kline) => set((state) => {
    // Update if exists, else append. Ensures no duplicates.
    const newKlines = state.klines.filter(k => k.time !== kline.time);
    newKlines.push(kline);
    return { klines: newKlines.sort((a,b) => a.time - b.time) };
  }),
  setConnected: (status) => set({ isConnected: status }),
  setError: (error) => set({ error }),
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

    const streams = [
        { name: 'ticker', type: 'ticker' },
        { name: 'depth20@100ms', type: 'depth' },
        { name: 'trade', type: 'trade' },
        { name: 'kline_1m', type: 'kline' },
    ];
    this.setupBufferedListener(streams);
  }

  // ---------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------
  disconnect() {
    this.sockets.forEach((ws) => {
        if(ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
    this.sockets = [];
  }
  
  // Public method for subscribing to tickers
  public subscribeToTickers(symbols: string[]) {
    const streamNames = symbols.map(s => `${s}@ticker`);
    const url = `wss://stream.binance.com:9443/ws/${streamNames.join('/')}`;
    const onMessage = (event: MessageEvent) => {
        const payload = JSON.parse(event.data);
        const data = payload.data || payload;
        if (data.e === '24hrTicker') {
             useMarketDataStore.getState().setTicker(data);
        }
    }
    this.createSocket(url, onMessage);
  }

  public unsubscribeFromTickers(symbols: string[]) {
    // In a real app, you might map sockets to subscription types to close them selectively.
    // For now, we'll just disconnect all when the component unmounts.
    this.disconnect();
  }


  // ---------------------------------------------------------
  // WebSocket helpers
  // ---------------------------------------------------------
  private createSocket(url: string, onMessage: (event: MessageEvent) => void) {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('[WS OPEN]', url);
      useMarketDataStore.getState().setConnected(true);
      useMarketDataStore.getState().setError(null);
    };

    ws.onerror = (err) => {
      console.error('[WS ERROR]', url, err);
      useMarketDataStore.getState().setError('WebSocket connection error.');
    };

    ws.onclose = () => {
      console.warn('[WS CLOSED]', url);
      useMarketDataStore.getState().setConnected(false);
    };

    ws.onmessage = onMessage;

    this.sockets.push(ws);
    return ws;
  }
  
  private setupBufferedListener(streams: {name: string, type: 'ticker' | 'depth' | 'trade' | 'kline'}[]) {
      const streamNames = streams.map(s => `${this.symbol.toLowerCase()}@${s.name}`);
      const url = `wss://stream.binance.com:9443/ws/${streamNames.join('/')}`;
      
      const onMessage = (event: MessageEvent) => {
        const payload = JSON.parse(event.data);

        // Combined stream format has a `stream` key
        const streamIdentifier = payload.stream || null;
        const data = payload.data || payload;
      
        // Depth update
        if (data.e === 'depthUpdate' || streamIdentifier?.includes('depth')) {
          useMarketDataStore.getState().setDepth(
            data.b || data.bids || [],
            data.a || data.asks || []
          );
        }
      
        // Ticker update
        if (data.e === '24hrTicker' || streamIdentifier?.includes('ticker')) {
          useMarketDataStore.getState().setTicker(data);
        }
      
        // Kline update
        if (data.e === 'kline' || streamIdentifier?.includes('kline')) {
            const { k } = data; // kline data is nested in 'k'
            useMarketDataStore.getState().pushKline({
              time: k.t / 1000,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
            });
        }
      
        // Trades update
        if (data.e === 'trade' || streamIdentifier?.includes('trade')) {
            useMarketDataStore.getState().pushTrade(data);
        }
      };
      
      this.createSocket(url, onMessage);
  }
}
