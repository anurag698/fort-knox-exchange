// Real-time MEXC data fetcher hook with polling
'use client';

import { useEffect, useState } from 'react';
import { mexcAPI, type MEXCTicker } from '@/services/mexc-api';
import useMarketDataStore from '@/state/market-data-store';

export function useMEXCTicker(symbol: string, enabled: boolean = true) {
    const [ticker, setTicker] = useState<MEXCTicker | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const setTickerStore = useMarketDataStore((s) => s.setTicker);

    useEffect(() => {
        if (!enabled || !symbol) return;

        let isMounted = true;
        let intervalId: NodeJS.Timeout;

        const fetchTicker = async () => {
            try {
                const data = await mexcAPI.get24hrTicker(symbol);
                if (isMounted && data) {
                    setTicker(data);
                    setIsLoading(false);
                    setError(null);

                    // Update market data store
                    setTickerStore(symbol, {
                        symbol: data.symbol,
                        price: parseFloat(data.lastPrice),
                        bidPrice: parseFloat(data.bidPrice),
                        askPrice: parseFloat(data.askPrice),
                        lastPrice: parseFloat(data.lastPrice),
                        high: parseFloat(data.highPrice),
                        low: parseFloat(data.lowPrice),
                        volume: parseFloat(data.volume),
                        change: parseFloat(data.priceChangePercent),
                        ts: Date.now(),
                    });
                }
            } catch (err) {
                if (isMounted) {
                    setError(err as Error);
                    setIsLoading(false);
                }
            }
        };

        // Initial fetch
        fetchTicker();

        // Poll every 2 seconds
        intervalId = setInterval(fetchTicker, 2000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [symbol, enabled, setTickerStore]);

    return { ticker, isLoading, error };
}

export function useMEXCKlines(symbol: string, interval: string = '1m', limit: number = 100, enabled: boolean = true) {
    const [klines, setKlines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const setKline = useMarketDataStore((s) => s.setKline);

    useEffect(() => {
        if (!enabled || !symbol) return;

        let isMounted = true;
        let intervalId: NodeJS.Timeout;

        const fetchKlines = async () => {
            try {
                const data = await mexcAPI.getKlines(symbol, interval, limit);
                if (isMounted && data.length > 0) {
                    setKlines(data);
                    setIsLoading(false);

                    // Update market data store with candles
                    const candles = data.map((k) => ({
                        t: k.openTime,
                        o: parseFloat(k.open),
                        h: parseFloat(k.high),
                        l: parseFloat(k.low),
                        c: parseFloat(k.close),
                        v: parseFloat(k.volume),
                    }));

                    setKline(symbol, candles);
                }
            } catch (err) {
                console.error('Error fetching MEXC klines:', err);
                if (isMounted) setIsLoading(false);
            }
        };

        // Initial fetch
        fetchKlines();

        // Poll every 10 seconds for klines
        intervalId = setInterval(fetchKlines, 10000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [symbol, interval, limit, enabled, setKline]);

    return { klines, isLoading };
}
