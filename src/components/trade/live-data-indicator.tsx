'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import mexcWebSocket from '@/services/mexc-websocket';

export function LiveDataIndicator() {
    const [isConnected, setIsConnected] = useState(false);
    const [updateCount, setUpdateCount] = useState(0);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        // Check connection status periodically
        const checkStatus = setInterval(() => {
            const ws = (mexcWebSocket as any).ws;
            const connected = ws?.readyState === WebSocket.OPEN;
            setIsConnected(connected);
        }, 1000);

        // Listen for data updates to show activity
        const handleUpdate = () => {
            setUpdateCount(c => c + 1);
            setLastUpdate(new Date());
        };

        // Subscribe to bus events
        if (typeof window !== 'undefined') {
            const bus = require('@/components/bus').bus;
            bus.on('ticker', handleUpdate);
            bus.on('kline', handleUpdate);
            bus.on('depth', handleUpdate);
        }

        return () => {
            clearInterval(checkStatus);
            if (typeof window !== 'undefined') {
                const bus = require('@/components/bus').bus;
                bus.off('ticker', handleUpdate);
                bus.off('kline', handleUpdate);
                bus.off('depth', handleUpdate);
            }
        };
    }, []);

    // Format last update time
    const timeSinceUpdate = lastUpdate
        ? Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
        : null;

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
            isConnected
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
        )}>
            {isConnected ? (
                <>
                    <Wifi className="h-3.5 w-3.5 text-green-500 animate-pulse" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-green-500">Live</span>
                        {timeSinceUpdate !== null && timeSinceUpdate < 5 && (
                            <Activity className="h-2.5 w-2.5 text-green-500/70 animate-ping absolute" />
                        )}
                    </div>
                </>
            ) : (
                <>
                    <WifiOff className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[10px] font-semibold text-red-500">Disconnected</span>
                </>
            )}

            {updateCount > 0 && (
                <span className="text-[9px] text-muted-foreground ml-1">
                    {updateCount} updates
                </span>
            )}
        </div>
    );
}
