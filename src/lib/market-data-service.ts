
'use client';

import { useMarketDataStore, type TickerData } from '@/hooks/use-market-data-store';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';

class MarketDataService {
  private ws: WebSocket | null = null;
  private marketId: string | null = null;
  private subscriptions: Set<string> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private static instance: MarketDataService | null = null;

  private constructor() {
    // The connect logic is now initiated by component mounts, not constructor
  }

  public static getInstance(): MarketDataService {
    if (typeof window === 'undefined') {
      // This is a server-side render, return a mock or null instance
      // to prevent errors. The actual service will be used on the client.
      return {
        connect: () => {},
        setMarket: () => {},
        subscribeToTickers: () => {},
        unsubscribeFromTickers: () => {},
      } as any;
    }

    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  private connect() {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      return;
    }
    useMarketDataStore.getState().setConnectionStatus(false);

    const streams = Array.from(this.subscriptions).join('/');
    if (streams.length === 0) {
        console.log("[MarketDataService] No subscriptions, not connecting.");
        return;
    }

    const url = `${BINANCE_WS_URL}?streams=${streams}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[MarketDataService] WebSocket connected.');
      this.reconnectAttempts = 0;
      useMarketDataStore.getState().setConnectionStatus(true);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.stream && message.data) {
        this.handleStreamData(message.stream, message.data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[MarketDataService] WebSocket error:', error);
      useMarketDataStore.getState().setConnectionStatus(false, 'WebSocket connection error.');
    };

    this.ws.onclose = () => {
      console.log('[MarketDataService] WebSocket disconnected.');
      useMarketDataStore.getState().setConnectionStatus(false);
      this.reconnect();
    };
  }

  private reconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectAttempts++;
    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
    console.log(`[MarketDataService] Reconnecting in ${delay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private subscribe(streams: string[]) {
    const newStreams = streams.filter(s => !this.subscriptions.has(s));
    if (newStreams.length === 0) return;

    newStreams.forEach(s => this.subscriptions.add(s));
    this.reconnectAndResubscribe();
  }

  private unsubscribe(streams: string[]) {
    const streamsToRemove = streams.filter(s => this.subscriptions.has(s));
    if(streamsToRemove.length === 0) return;

    streams.forEach(s => this.subscriptions.delete(s));
     this.reconnectAndResubscribe();
  }
  
  private reconnectAndResubscribe() {
    if (this.ws) {
        this.ws.onclose = null; // Prevent reconnect loop
        this.ws.close();
    }
    this.connect();
  }

  setMarket(marketId: string) {
    if (this.marketId === marketId) return;

    if (this.marketId) {
      const oldSymbol = this.marketId.replace('-', '').toLowerCase();
      this.unsubscribe([`${oldSymbol}@depth`, `${oldSymbol}@trade`, `${oldSymbol}@ticker`]);
    }
    
    this.marketId = marketId;
    const newSymbol = marketId.replace('-', '').toLowerCase();
    this.subscribe([`${newSymbol}@depth`, `${newSymbol}@trade`, `${newSymbol}@ticker`]);
  }
  
  subscribeToTickers(symbols: string[]) {
    const streams = symbols.map(s => `${s}@ticker`);
    this.subscribe(streams);
  }

  unsubscribeFromTickers(symbols: string[]) {
    const streams = symbols.map(s => `${s}@ticker`);
    this.unsubscribe(streams);
  }

  private handleStreamData(stream: string, data: any) {
    const [symbol, type] = stream.split('@');
    
    switch (type) {
        case 'depth':
            useMarketDataStore.getState().setDepth(data.bids, data.asks);
            break;
        case 'trade':
            useMarketDataStore.getState().addTrade(data);
            break;
        case 'ticker':
            const tickerData: TickerData = {
                price: parseFloat(data.c),
                priceChangePercent: parseFloat(data.P),
                high: parseFloat(data.h),
                low: parseFloat(data.l),
                volume: parseFloat(data.v),
                quoteVolume: parseFloat(data.q),
                eventTime: data.E,
            }
            useMarketDataStore.getState().updateTicker(symbol, tickerData);
            break;
    }
  }
}

// Ensure singleton instance on the client
export const marketDataService = MarketDataService.getInstance();
