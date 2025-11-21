// MEXC WebSocket Client for Real-time Market Data
// Documentation: https://mexcdevelop.github.io/apidocs/spot_v3_en/#websocket-market-streams

'use client';

import useMarketDataStore from '@/state/market-data-store';
import { bus } from '@/components/bus';

const MEXC_WS_URL = 'wss://wbs-api.mexc.com/ws';
const MEXC_REST_BASE = '/api/mexc';

interface MEXCTickerData {
    s: string;
    p: string;
    P: string;
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    q: string;
    O: number;
    C: number;
}

interface MEXCKlineData {
    t: number;
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    T: number;
    q: string;
}

interface MEXCTradeData {
    p: string;
    q: string;
    T: number;
    m: boolean;
}

interface MEXCDepthData {
    bids: [string, string][];
    asks: [string, string][];
}

class MEXCWebSocketClient {
    private ws: WebSocket | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private pingTimer: NodeJS.Timeout | null = null;
    private subscriptions: Set<string> = new Set();
    private isConnecting = false;
    private shouldReconnect = true;

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        try {
            this.ws = new WebSocket(MEXC_WS_URL);

            this.ws.onopen = () => {
                console.log('[MEXC WS] Connected');
                this.isConnecting = false;

                this.subscriptions.forEach(channel => {
                    this.send({ method: 'SUBSCRIPTION', params: [channel] });
                });

                this.pingTimer = setInterval(() => {
                    if (this.ws?.readyState === WebSocket.OPEN) {
                        this.ws.send('ping');
                    }
                }, 30000);
            };

            this.ws.onmessage = (event) => {
                if (event.data === 'pong') {
                    return;
                }

                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[MEXC WS] Parse error:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[MEXC WS] Error:', error);
            };

            this.ws.onclose = () => {
                console.log('[MEXC WS] Disconnected');
                this.isConnecting = false;

                if (this.pingTimer) {
                    clearInterval(this.pingTimer);
                    this.pingTimer = null;
                }

                if (this.shouldReconnect) {
                    this.reconnectTimer = setTimeout(() => {
                        console.log('[MEXC WS] Reconnecting...');
                        this.connect();
                    }, 3000);
                }
            };
        } catch (error) {
            console.error('[MEXC WS] Connection failed:', error);
            this.isConnecting = false;
        }
    }

    private send(data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    private handleMessage(message: any) {
        const { c: channel, d: data } = message;

        if (!channel || !data) {
            return;
        }

        if (channel.includes('ticker')) {
            this.handleTicker(data as MEXCTickerData);
        } else if (channel.includes('kline')) {
            this.handleKline(channel, data as MEXCKlineData);
        } else if (channel.includes('deals')) {
            this.handleTrade(data as MEXCTradeData, channel);
        } else if (channel.includes('depth')) {
            this.handleDepth(data as MEXCDepthData, channel);
        }
    }

    private handleTicker(ticker: MEXCTickerData) {
        const store = useMarketDataStore.getState();
        const tickerData = {
            symbol: ticker.s,
            bidPrice: parseFloat(ticker.c),
            askPrice: parseFloat(ticker.c),
            lastPrice: parseFloat(ticker.c),
            high: parseFloat(ticker.h),
            low: parseFloat(ticker.l),
            volume: parseFloat(ticker.v),
            change: parseFloat(ticker.P),
            ts: Date.now(),
        };

        store.setTicker(ticker.s, tickerData);
        bus.emit('ticker', tickerData);
    }

    private handleKline(channel: string, kline: MEXCKlineData) {
        const symbolMatch = channel.match(/@([A-Z0-9]+)/);
        if (!symbolMatch) return;

        const symbol = symbolMatch[1];
        const store = useMarketDataStore.getState();

        const candleData = {
            t: kline.t,
            o: parseFloat(kline.o),
            h: parseFloat(kline.h),
            l: parseFloat(kline.l),
            c: parseFloat(kline.c),
            v: parseFloat(kline.v),
        };

        store.setKline(symbol, candleData);
        bus.emit('kline', candleData);
        console.log('[MEXC] Kline update:', symbol);
    }

    private handleTrade(trade: MEXCTradeData, channel: string) {
        const symbolMatch = channel.match(/@([A-Z0-9]+)/);
        if (!symbolMatch) return;

        const symbol = symbolMatch[1];
        const store = useMarketDataStore.getState();

        store.pushTrade(symbol, {
            p: trade.p,
            q: trade.q,
            S: trade.m ? 'sell' : 'buy',
            t: trade.T,
        } as any);
    }

    private handleDepth(depth: MEXCDepthData, channel: string) {
        const symbolMatch = channel.match(/@([A-Z0-9]+)/);
        if (!symbolMatch) return;

        const symbol = symbolMatch[1];
        const store = useMarketDataStore.getState();

        store.setDepth(symbol, {
            bids: depth.bids.map(([price, size]) => ({
                price: parseFloat(price),
                size: parseFloat(size)
            })),
            asks: depth.asks.map(([price, size]) => ({
                price: parseFloat(price),
                size: parseFloat(size)
            })),
            ts: Date.now(),
        });
    }

    subscribeTicker(symbol: string) {
        const channel = `spot@public.ticker.v3.api@${symbol}`;
        this.subscriptions.add(channel);
        this.send({ method: 'SUBSCRIPTION', params: [channel] });
    }

    subscribeKline(symbol: string, interval: string = '1m') {
        const channel = `spot@public.kline.v3.api@${symbol}@${interval}`;
        this.subscriptions.add(channel);
        this.send({ method: 'SUBSCRIPTION', params: [channel] });
    }

    subscribeTrades(symbol: string) {
        const channel = `spot@public.deals.v3.api@${symbol}`;
        this.subscriptions.add(channel);
        this.send({ method: 'SUBSCRIPTION', params: [channel] });
    }

    subscribeDepth(symbol: string, limit: number = 20) {
        const channel = `spot@public.limit.depth.v3.api@${symbol}@${limit}`;
        this.subscriptions.add(channel);
        this.send({ method: 'SUBSCRIPTION', params: [channel] });
    }

    subscribeAll(symbol: string, interval: string = '1m') {
        this.subscribeTicker(symbol);
        this.subscribeKline(symbol, interval);
        this.subscribeTrades(symbol);
        this.subscribeDepth(symbol);
    }

    unsubscribe(channel: string) {
        this.subscriptions.delete(channel);
        this.send({ method: 'UNSUBSCRIPTION', params: [channel] });
    }

    unsubscribeAll(symbol: string) {
        const channelsToRemove = Array.from(this.subscriptions).filter(ch => ch.includes(`@${symbol}`));
        channelsToRemove.forEach(channel => {
            this.unsubscribe(channel);
        });
    }

    disconnect() {
        this.shouldReconnect = false;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.subscriptions.clear();
    }

    async fetchInitialData(symbol: string) {
        console.log(`[MEXC] Fetching initial data for ${symbol}...`);

        try {
            // Fetch 24hr ticker
            console.log(`[MEXC] Requesting ticker from /api/mexc/ticker?symbol=${symbol}`);
            const tickerRes = await fetch(`${MEXC_REST_BASE}/ticker?symbol=${symbol}`);

            if (!tickerRes.ok) {
                console.error(`[MEXC] Ticker request failed: ${tickerRes.status} ${tickerRes.statusText}`);
            } else {
                const ticker = await tickerRes.json();
                console.log('[MEXC] Fetched ticker:', ticker);

                const store = useMarketDataStore.getState();
                const tickerData = {
                    symbol: ticker.symbol,
                    bidPrice: parseFloat(ticker.bidPrice),
                    askPrice: parseFloat(ticker.askPrice),
                    lastPrice: parseFloat(ticker.lastPrice),
                    high: parseFloat(ticker.highPrice),
                    low: parseFloat(ticker.lowPrice),
                    volume: parseFloat(ticker.volume),
                    change: parseFloat(ticker.priceChangePercent),
                    ts: Date.now(),
                };

                store.setTicker(symbol, tickerData);
                bus.emit('ticker', tickerData);
                console.log('[MEXC] Ticker data set in store and emitted to bus');
            }

            // Fetch klines
            console.log(`[MEXC] Requesting klines from /api/mexc/klines?symbol=${symbol}&interval=1m&limit=500`);
            const klinesRes = await fetch(`${MEXC_REST_BASE}/klines?symbol=${symbol}&interval=1m&limit=500`);

            if (!klinesRes.ok) {
                console.error(`[MEXC] Klines request failed: ${klinesRes.status} ${klinesRes.statusText}`);
            } else {
                const klines = await klinesRes.json();
                console.log(`[MEXC] Fetched ${klines.length} klines`);

                const store = useMarketDataStore.getState();
                const candles = klines.map((k: any) => ({
                    t: k[0],
                    o: parseFloat(k[1]),
                    h: parseFloat(k[2]),
                    l: parseFloat(k[3]),
                    c: parseFloat(k[4]),
                    v: parseFloat(k[5]),
                }));

                store.setKline(symbol, candles);
                console.log('[MEXC] Klines data set in store');

                // Do NOT emit individual kline events for history to avoid flooding the chart
                // The ChartEngine will pick up the initial data from the store on mount
                console.log('[MEXC] Historical klines loaded into store (events suppressed)');
                bus.emit('history-loaded', { symbol });
            }

            // Fetch order book
            console.log(`[MEXC] Requesting depth from /api/mexc/depth?symbol=${symbol}&limit=20`);
            const depthRes = await fetch(`${MEXC_REST_BASE}/depth?symbol=${symbol}&limit=20`);

            if (!depthRes.ok) {
                console.error(`[MEXC] Depth request failed: ${depthRes.status} ${depthRes.statusText}`);
            } else {
                const depth = await depthRes.json();
                console.log('[MEXC] Fetched order book');

                const store = useMarketDataStore.getState();
                const depthData = {
                    bids: depth.bids.map(([price, size]: [string, string]) => ({
                        price: parseFloat(price),
                        size: parseFloat(size)
                    })),
                    asks: depth.asks.map(([price, size]: [string, string]) => ({
                        price: parseFloat(price),
                        size: parseFloat(size)
                    })),
                    ts: Date.now(),
                };

                store.setDepth(symbol, depthData);
                bus.emit('depth', depthData);
                console.log('[MEXC] Depth data set in store and emitted to bus');
            }

            console.log('[MEXC] ✅ Initial data loading complete!');
        } catch (error) {
            console.error('[MEXC] ❌ Failed to fetch initial data:', error);
            throw error;
        }
    }
}

export const mexcWebSocket = new MEXCWebSocketClient();
export default mexcWebSocket;
