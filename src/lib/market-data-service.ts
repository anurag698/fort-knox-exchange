
"use client";

class MarketDataService {
    private websockets: Map<string, WebSocket> = new Map();
    private static instance: MarketDataService;

    private constructor() {
        // Private constructor to enforce singleton
    }

    public static getInstance(): MarketDataService {
        if (!MarketDataService.instance) {
            MarketDataService.instance = new MarketDataService();
        }
        return MarketDataService.instance;
    }

    public subscribe(
        streamName: string, 
        onMessage: (data: any) => void, 
        onOpen?: () => void, 
        onError?: (error: string) => void
    ) {
        const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
        
        // If a websocket for this stream already exists, just add the new callbacks
        if (this.websockets.has(streamName)) {
            const ws = this.websockets.get(streamName)!;
            // This is a simplified approach; a more robust solution would manage multiple callbacks per stream
        }

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log(`[WebSocket] Connected to ${streamName}`);
            if (onOpen) onOpen();
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        };

        ws.onerror = (event) => {
            console.error(`[WebSocket] Error on ${streamName}:`, event);
            if (onError) onError('WebSocket connection failed.');
        };
        
        ws.onclose = () => {
            console.log(`[WebSocket] Disconnected from ${streamName}`);
            this.websockets.delete(streamName);
        };

        this.websockets.set(streamName, ws);

        return {
            close: () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
                this.websockets.delete(streamName);
            }
        };
    }
}

export const marketDataService = MarketDataService.getInstance();
