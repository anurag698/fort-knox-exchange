
'use client';

import { useMarketDataStore } from '@/hooks/use-market-data-store';
import type { TickerData } from '@/hooks/use-market-data-store';

class MarketDataService {
  private ws: WebSocket | null = null;
  private static instance: MarketDataService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentStreams: Set<string> = new Set();
  private subscriptions: Map<string, ((data: any) => void)[]> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  private connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.ws) {
      this.ws.close();
    }
    
    if(this.currentStreams.size === 0) {
        console.log('[WebSocket] No streams to connect to.');
        return;
    }

    const streamNames = Array.from(this.currentStreams).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streamNames}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`[WebSocket] Connected to streams: ${streamNames}`);
      this.reconnectAttempts = 0;
      useMarketDataStore.getState().setConnectionStatus(true);
    };

    this.ws.onmessage = (event) => {
      const { stream, data } = JSON.parse(event.data);
      const state = useMarketDataStore.getState();
      const symbol = data.s.toLowerCase();

      // Dispatch to Zustand store
      if (stream.endsWith('@depth')) {
        state.setDepth(data.bids, data.asks);
      } else if (stream.endsWith('@trade')) {
        state.addTrade(data);
      } else if (stream.endsWith('@ticker')) {
         state.updateTicker(symbol, {
            price: parseFloat(data.c),
            priceChangePercent: parseFloat(data.P),
            high: parseFloat(data.h),
            low: parseFloat(data.l),
            volume: parseFloat(data.v),
            quoteVolume: parseFloat(data.q),
            eventTime: data.E,
        });
      }
      
      // Dispatch to individual subscribers
      if (this.subscriptions.has(stream)) {
        this.subscriptions.get(stream)?.forEach(cb => cb(data));
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
        this.reconnectTimeout = setTimeout(() => this.connect(), delay);
      }
    };
  }

  public subscribe(streamName: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(streamName)) {
        this.subscriptions.set(streamName, []);
    }
    this.subscriptions.get(streamName)?.push(callback);

    if (!this.currentStreams.has(streamName)) {
        this.currentStreams.add(streamName);
        this.connect(); // Reconnect with the new stream
    }

    // Return an unsubscribe function
    return () => {
        const cbs = this.subscriptions.get(streamName);
        if (cbs) {
            const index = cbs.indexOf(callback);
            if (index > -1) {
                cbs.splice(index, 1);
            }
            if (cbs.length === 0) {
              this.subscriptions.delete(streamName);
              this.currentStreams.delete(streamName);
              // Optionally, you might want to reconnect if streams are removed
              // to close the old connection and open a new one with fewer streams.
              this.connect();
            }
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
    this.currentStreams.clear();
    this.subscriptions.clear();
    useMarketDataStore.getState().setConnectionStatus(false);
    console.log('[WebSocket] Manually disconnected and all subscriptions cleared.');
  }
}

export const marketDataService = MarketDataService.getInstance();
