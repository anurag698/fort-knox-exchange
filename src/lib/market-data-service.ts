class MarketDataService {
  static instances: any = {};
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

  subscribeDepth(cb: any) { this.depthCallbacks.push(cb); }
  subscribeTicker(cb: any) { this.tickerCallbacks.push(cb); }
  subscribeTrades(cb: any) { this.tradeCallbacks.push(cb); }
  subscribeKline(cb: any) { this.klineCallbacks.push(cb); }

  // DEPTH
  initDepth() {
    const ws = new WebSocket(`wss://stream.binance.com/ws/${this.symbol}@depth20@100ms`);
    ws.onmessage = msg => {
      const d = JSON.parse(msg.data);
      this.depthCallbacks.forEach(cb => cb({ bids: d.b, asks: d.a }));
    };
  }

  // MINI TICKER
  initTicker() {
    const ws = new WebSocket(`wss://stream.binance.com/ws/${this.symbol}@ticker`);
    ws.onmessage = msg => {
      const t = JSON.parse(msg.data);
      this.tickerCallbacks.forEach(cb => cb(t));
    };
  }

  // TRADES
  initTrades() {
    const ws = new WebSocket(`wss://stream.binance.com/ws/${this.symbol}@trade`);
    ws.onmessage = msg => {
      const t = JSON.parse(msg.data);
      this.tradeCallbacks.forEach(cb => cb(t));
    };
  }

  // KLINE (1m)
  initKline() {
    const ws = new WebSocket(`wss://stream.binance.com/ws/${this.symbol}@kline_1m`);
    ws.onmessage = msg => {
      const k = JSON.parse(msg.data).k;
      this.klineCallbacks.forEach(cb => cb({
        time: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c)
      }));
    };
  }
}

export default MarketDataService;
