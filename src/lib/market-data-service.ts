"use client";

class MarketDataService {
  static instances: Record<string, MarketDataService> = {};
  symbol: string;

  depthCallbacks: any[] = [];
  tickerCallbacks: any[] = [];
  tradeCallbacks: any[] = [];
  klineCallbacks: any[] = [];

  constructor(symbol: string) {
    this.symbol = symbol;

    this.initDepth();
    this.initTrades();
    this.initTicker();
    this.initKline();
  }

  static getInstance(symbol: string) {
    if (!this.instances[symbol]) {
      this.instances[symbol] = new MarketDataService(symbol);
    }
    return this.instances[symbol];
  }

  subscribeDepth(cb: any) { this.depthCallbacks.push(cb); return () => {}; }
  subscribeTicker(cb: any) { this.tickerCallbacks.push(cb); return () => {}; }
  subscribeTrades(cb: any) { this.tradeCallbacks.push(cb); return () => {}; }
  subscribeKline(cb: any) { this.klineCallbacks.push(cb); return () => {}; }

  // ORDERBOOK DEPTH
  initDepth() {
    const ws = new WebSocket(`wss://stream.binance.com/ws/${this.symbol}@depth20@100ms`);
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      this.depthCallbacks.forEach(cb => cb({ bids: data.b, asks: data.a }));
    };
  }

  // TICKER
  initTicker() {
    const ws = new WebSocket(`wss://stream.binance.com/ws/${this.symbol}@ticker`);
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      this.tickerCallbacks.forEach(cb => cb(data));
    };
  }

  // TRADES
  initTrades() {
    const ws = new WebSocket(`wss://stream.binance.com/ws/${this.symbol}@trade`);
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      this.tradeCallbacks.forEach(cb => cb(data));
    };
  }

  // KLINE (1m)
  initKline() {
    const ws = new WebSocket(`wss://stream.binance.com/ws/${this.symbol}@kline_1m`);
    ws.onmessage = (msg) => {
      const k = JSON.parse(msg.data).k;
      this.klineCallbacks.forEach(cb =>
        cb({
          time: k.t,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        })
      );
    };
  }
}

export default MarketDataService;