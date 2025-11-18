
'use client';

import { create } from 'zustand';

// ------------------------------
// Types
// ------------------------------
export type TickerData = {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Weighted average price
  x: string; // First trade price
  c: string; // Last price
  Q: string; // Last quantity
  b: string; // Best bid price
  B: string; // Best bid quantity
  a: string; // Best ask price
  A: string; // Best ask quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  O: number; // Statistics open time
  C: number; // Statistics close time
  F: number; // First trade ID
  L: number; // Last trade ID
  n: number; // Total number of trades
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
  ticker: TickerData | null;
  bids: ProcessedOrder[];
  asks: ProcessedOrder[];
  trades: any[];
  klines: any[];
  isConnected: boolean;
  error: string | null;
  hoveredPrice: number | null;
  setTicker: (data: TickerData) => void;
  setDepth: (bids: RawOrder[], asks: RawOrder[]) => void;
  setTrades: (t: any[]) => void;
  pushTrade: (trade: any) => void;
  setKlines: (k: any[]) => void;
  pushKline: (kline: any) => void;
  setConnected: (status: boolean) => void;
  setError: (error: string | null) => void;
  setHoveredPrice: (price: number | null) => void;
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
  ticker: null,
  bids: [],
  asks: [],
  trades: [],
  klines: [],
  isConnected: false,
  error: null,
  hoveredPrice: null,
  setTicker: (data) => set({ ticker: data }),
  setDepth: (bids, asks) => {
    // ----------------------
    // Detect Order Book Walls
    // ----------------------
    function detectWalls(levels: RawOrder[]): ProcessedOrder[] {
        if (!Array.isArray(levels) || levels.length === 0) return [];

        const top15Levels = levels.slice(0, 15);
        const amounts = top15Levels.map((lvl) => parseFloat(lvl[1]) || 0);
        const avg = amounts.reduce((a, b) => a + b, 0) / (amounts.length || 1);
        const threshold = avg * 2.5;

        return levels.map((lvl) => {
            const price = parseFloat(lvl[0]);
            const size = parseFloat(lvl[1]);
            return {
                price,
                size,
                isWall: size >= threshold,
            };
        });
    }

    const processedBids = detectWalls(bids);
    const processedAsks = detectWalls(asks);
    
    set({
        bids: processedBids,
        asks: processedAsks,
    });
  },
  setTrades: (t) => set({ trades: t }),
  pushTrade: (trade) =>
    set((state) => ({
      trades: [...state.trades, trade].slice(-100), // Keep last 100 trades
    })),
  setKlines: (k) => set({ klines: k }),
  pushKline: (kline) =>
    set((state) => {
      const newKlines = state.klines.filter((k) => k.time !== kline.time);
      newKlines.push(kline);
      return { klines: newKlines.sort((a, b) => a.time - b.time) };
    }),
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
  private sockets: WebSocket[] = [];

  private constructor(symbol: string) {
    this.symbol = symbol;
  }

  static get(symbol: string) {
    if (!this.instances.has(symbol)) {
      this.instances.set(symbol, new MarketDataService(symbol));
    }
    return this.instances.get(symbol)!;
  }

  connect() {
    this.disconnect();

    const streams = [
      { name: 'ticker', type: 'ticker' },
      { name: 'depth20@100ms', type: 'depth' },
      { name: 'trade', type: 'trade' },
      { name: 'kline_1m', type: 'kline' },
    ];
    this.setupBufferedListener(streams);
  }

  disconnect() {
    this.sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.sockets = [];
  }

  public subscribeToTickers(symbols: string[]) {
    const streamNames = symbols.map((s) => `${s}@ticker`);
    const url = `wss://stream.binance.com:9443/ws/${streamNames.join('/')}`;
    const onMessage = (event: MessageEvent) => {
      const payload = JSON.parse(event.data);
      const data = payload.data || payload;
      if (data.e === '24hrTicker') {
        useMarketDataStore.getState().setTicker(data);
      }
    };
    this.createSocket(url, onMessage);
  }

  public unsubscribeFromTickers(symbols: string[]) {
    this.disconnect();
  }

  private createSocket(url: string, onMessage: (event: MessageEvent) => void) {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      useMarketDataStore.getState().setConnected(true);
      useMarketDataStore.getState().setError(null);
    };
    ws.onerror = (err) => {
      console.error('[WS ERROR]', url, err);
      useMarketDataStore.getState().setError('WebSocket connection error.');
    };
    ws.onclose = () => {
      useMarketDataStore.getState().setConnected(false);
    };
    ws.onmessage = onMessage;
    this.sockets.push(ws);
    return ws;
  }

  private setupBufferedListener(
    streams: { name: string; type: 'ticker' | 'depth' | 'trade' | 'kline' }[]
  ) {
    const streamNames = streams.map(
      (s) => `${this.symbol.toLowerCase()}@${s.name}`
    );
    const url = `wss://stream.binance.com:9443/ws/${streamNames.join('/')}`;

    // ---- Auto-Zoom system state ----
    let lastMid = 0;
    let lastSpread = 0;
    let lastDepthSignature = '';

    const emitZoomEvent = (reason: string) => {
      window.dispatchEvent(
        new CustomEvent('depth:autoZoom', {
          detail: { reason, ts: Date.now() }
        })
      );
    };

    const computeSignature = (bids: RawOrder[], asks: RawOrder[]) => {
      const top5b = bids.slice(0, 5).map((b) => b.join('-')).join('|');
      const top5a = asks.slice(0, 5).map((a) => a.join('-')).join('|');
      return top5b + '::' + top5a;
    };

    const onMessage = (event: MessageEvent) => {
      const payload = JSON.parse(event.data);
      const streamIdentifier = payload.stream || null;
      const data = payload.data || payload;

      // -----------------------------------------
      // DEPTH UPDATE
      // -----------------------------------------
      if (data.e === 'depthUpdate' || streamIdentifier?.includes('depth')) {
        const bids = data.b || [];
        const asks = data.a || [];

        useMarketDataStore.getState().setDepth(bids, asks);

        // ---- Auto-Zoom Trigger Logic ----
        if (bids.length > 0 && asks.length > 0) {
          const bestBid = parseFloat(bids[0][0]);
          const bestAsk = parseFloat(asks[0][0]);

          const mid = (bestBid + bestAsk) / 2;
          const spread = bestAsk - bestBid;

          // Spread change trigger (Binance Spot threshold ~1.6%)
          if (lastSpread === 0 || Math.abs(spread - lastSpread) / spread > 0.016) {
            emitZoomEvent('spread-change');
            lastSpread = spread;
          }

          // Mid-price movement trigger (~1.2%)
          if (lastMid === 0 || Math.abs(mid - lastMid) / mid > 0.012) {
            emitZoomEvent('mid-move');
            lastMid = mid;
          }

          // Depth shape signature check
          const signature = computeSignature(bids, asks);
          if (signature !== lastDepthSignature) {
            emitZoomEvent('depth-shape');
            lastDepthSignature = signature;
          }
        }
      }

      // -----------------------------------------
      // TICKER UPDATE
      // -----------------------------------------
      if (data.e === '24hrTicker' || streamIdentifier?.includes('ticker')) {
        useMarketDataStore.getState().setTicker(data);
      }

      // -----------------------------------------
      // KLINE UPDATE
      // -----------------------------------------
      if (data.e === 'kline' || streamIdentifier?.includes('kline')) {
        const { k } = data;
        useMarketDataStore.getState().pushKline({
          time: k.t / 1000,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        });
      }

      // -----------------------------------------
      // TRADE UPDATE
      // -----------------------------------------
      if (data.e === 'trade' || streamIdentifier?.includes('trade')) {
        useMarketDataStore.getState().pushTrade(data);
      }
    };

    this.createSocket(url, onMessage);
  }
}

export const marketDataService = MarketDataService;
