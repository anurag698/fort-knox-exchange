'use client';

import { useEffect, useRef } from 'react';
import { mexcWebSocket } from '@/services/mexc-websocket';
import useMarketDataStore from '@/state/market-data-store';

interface MarketDataSubscriberProps {
    marketId: string;
}

export function MarketDataSubscriber({ marketId }: MarketDataSubscriberProps) {
    // Convert marketId (e.g., "BTC-USDT") to symbol format (e.g., "BTCUSDT")
    const symbol = marketId.replace('-', '').toUpperCase();
    const setFeedStatus = useMarketDataStore((s) => s.setFeedStatus);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        let retryTimer: NodeJS.Timeout;

        const init = async () => {
            try {
                setFeedStatus({ status: 'connecting', symbol });

                // 1. Connect WS
                mexcWebSocket.connect();

                // 2. Fetch initial snapshot (REST)
                await mexcWebSocket.fetchInitialData(symbol);

                // 3. Subscribe to real-time updates
                if (isMounted.current) {
                    mexcWebSocket.subscribeAll(symbol);
                    setFeedStatus({ status: 'connected', symbol });
                }
            } catch (error) {
                console.error('[MarketDataSubscriber] Failed to initialize:', error);
                setFeedStatus({ status: 'error', symbol, error });

                // Retry after 5s if failed
                if (isMounted.current) {
                    retryTimer = setTimeout(init, 5000);
                }
            }
        };

        init();

        return () => {
            isMounted.current = false;
            clearTimeout(retryTimer);
            mexcWebSocket.unsubscribeAll(symbol);
            // We don't disconnect the socket itself as other components might use it,
            // or we might just be switching pages. The socket handles its own lifecycle.
            setFeedStatus({ status: 'disconnected', symbol });
        };
    }, [symbol, setFeedStatus]);

    return null; // Headless component
}
