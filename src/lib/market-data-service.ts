
'use client';

import { useMarketDataStore } from '@/hooks/use-market-data-store';

class MarketDataService {
  private ws: WebSocket | null = null;
  private static instance: MarketDataService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentSymbol: string | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  public connect(symbol: string, streams: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentSymbol === symbol) {
      console.log('[WebSocket] Already connected to the correct symbol.');
      return;
    }

    if (this.ws) {
      this.disconnect();
    }

    this.currentSymbol = symbol;
    const streamNames = streams.map(s => `${symbol}@${s}`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streamNames}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`[WebSocket] Connected to ${symbol}`);
      this.reconnectAttempts = 0;
      useMarketDataStore.getState().setConnectionStatus(true);
    };

    this.ws.onmessage = (event) => {
      const { stream, data } = JSON.parse(event.data);
      const streamType = stream.split('@')[1];
      const state = useMarketDataStore.getState();

      switch (streamType) {
        case 'depth':
          state.setDepth(data.b, data.a);
          break;
        case 'trade':
          state.addTrade(data);
          break;
        case 'ticker':
          state.updateTicker(symbol, {
            price: parseFloat(data.c),
            priceChangePercent: parseFloat(data.P),
            high: parseFloat(data.h),
            low: parseFloat(data.l),
            volume: parseFloat(data.v),
            quoteVolume: parseFloat(data.q),
            eventTime: data.E,
          });
          break;
        case 'kline_1m':
          // The chart component will handle its own kline data for now.
          break;
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      useMarketDataStore.getState().setConnectionStatus(false, 'Connection error');
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected.');
      useMarketDataStore.getState().setConnectionStatus(false);
      this.ws = null;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
        console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
        this.reconnectTimeout = setTimeout(() => this.connect(symbol, streams), delay);
      }
    };
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentSymbol = null;
    useMarketDataStore.getState().setConnectionStatus(false);
    console.log('[WebSocket] Manually disconnected.');
  }
}

export const marketDataService = MarketDataService.getInstance();
