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
  pushKline: (kline) => set((state) => ({
    klines: [...state.klines.filter(k => k.time !== kline.time), kline]
  })),
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

    this.openTicker();
    this.openDepth();
    this.openTrades();
    this.openKline('1m');
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

  // ---------------------------------------------------------
  // WebSocket helpers
  // ---------------------------------------------------------
  private createSocket(url: string, onMessage: (d: any) => void) {
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
      console.warn('[WS CLOSED — Reconnecting]', url);
      useMarketDataStore.getState().setConnected(false);
      // Only auto-reconnect if it's not a manual disconnect
      if (this.sockets.includes(ws)) {
          setTimeout(() => this.createSocket(url, onMessage), 1500);
      }
    };

    ws.onmessage = onMessage;

    this.sockets.push(ws);
    return ws;
  }
  
  private setupBufferedListener(streams: {name: string, type: 'ticker' | 'depth' | 'trade' | 'kline'}[]) {
      const streamNames = streams.map(s => `${this.symbol.toLowerCase()}@${s.name}`);
      const url = `wss://stream.binance.com:9443/ws/${streamNames.join('/')}`;
      
      let depthBuffer: any = null;
      let tickerBuffer: any = null;
      let tradesBuffer: any[] = [];
      let klineBuffer: any = null;
      let lastDispatch = 0;
      let frameId: number;

      const dispatch = () => {
          if (depthBuffer) {
              const { b, a } = depthBuffer;
              useMarketDataStore.getState().setDepth(b, a);
              depthBuffer = null;
          }
          if (tickerBuffer) {
              useMarketDataStore.getState().setTicker(tickerBuffer);
              tickerBuffer = null;
          }
          if (tradesBuffer.length > 0) {
              const trades = tradesBuffer;
              tradesBuffer = [];
              trades.forEach(trade => useMarketDataStore.getState().pushTrade({
                  p: trade.p, // price
                  q: trade.q, // quantity
                  T: trade.T, // timestamp
                  m: trade.m, // is market maker
              }));
          }
          if (klineBuffer) {
              const k = klineBuffer.k;
              useMarketDataStore.getState().pushKline({
                  time: k.t / 1000, open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c),
              });
              klineBuffer = null;
          }
      };

      const onMessage = (event: MessageEvent) => {
          const { stream, data } = JSON.parse(event.data);
          const streamName = stream.split('@')[1];
          
          if (streamName === 'depth20@100ms') depthBuffer = data;
          else if (streamName === 'ticker') tickerBuffer = data;
          else if (streamName === 'trade') tradesBuffer.push(data);
          else if (streamName.startsWith('kline_')) klineBuffer = data;

          const now = performance.now();
          if (now - lastDispatch > 16) { // ~60fps
              if (frameId) cancelAnimationFrame(frameId);
              frameId = requestAnimationFrame(dispatch);
              lastDispatch = now;
          }
      };
      
      this.createSocket(url, onMessage);
  }


  // ---------------------------------------------------------
  // STREAM: Ticker
  // ---------------------------------------------------------
  private openTicker() {
    this.setupBufferedListener([{ name: 'ticker', type: 'ticker' }]);
  }

  // ---------------------------------------------------------
  // STREAM: Depth
  // ---------------------------------------------------------
  private openDepth() {
    this.setupBufferedListener([{ name: 'depth20@100ms', type: 'depth' }]);
  }

  // ---------------------------------------------------------
  // STREAM: Trades (Buffered)
  // ---------------------------------------------------------
  private openTrades() {
    this.setupBufferedListener([{ name: 'trade', type: 'trade' }]);
  }

  // ---------------------------------------------------------
  // STREAM: Kline (interval)
  // ---------------------------------------------------------
  private openKline(interval: string) {
    this.setupBufferedListener([{ name: `kline_${interval}`, type: 'kline' }]);
  }
}
