'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, BarChart3, Zap } from 'lucide-react';
import { useMarketDataStore } from '@/state/market-data-store';
import { useMarkets } from '@/hooks/use-markets';

export function LiveStatsBanner() {
    const [volume24h, setVolume24h] = useState(0);
    const marketData = useMarketDataStore(state => state.ticker);
    const { data: markets } = useMarkets();

    useEffect(() => {
        if (markets && marketData) {
            // Calculate total 24h volume across all markets
            const total = markets.reduce((acc, market) => {
                const ticker = marketData[market.id];
                if (ticker?.volume && ticker?.price) {
                    return acc + (ticker.volume * ticker.price);
                }
                return acc;
            }, 0);
            setVolume24h(total);
        }
    }, [markets, marketData]);

    const stats = [
        {
            icon: BarChart3,
            label: '24h Trading Volume',
            value: `$${(volume24h / 1000000).toFixed(2)}M`,
            change: '+12.5%',
            color: 'text-green-500'
        },
        {
            icon: Users,
            label: 'Active Traders',
            value: '150K+',
            change: '+8.2%',
            color: 'text-primary'
        },
        {
            icon: TrendingUp,
            label: 'Total Markets',
            value: markets?.length || 0,
            change: 'Live',
            color: 'text-blue-500'
        },
        {
            icon: Zap,
            label: 'Trading Fee',
            value: '0.1%',
            change: 'Lowest',
            color: 'text-yellow-500'
        }
    ];

    return (
        <div className="w-full bg-gradient-to-r from-card via-card/80 to-card border-b border-primary/10 overflow-hidden">
            <div className="container mx-auto px-4 py-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg glass hover-lift cursor-pointer animate-scale-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className={`p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                                <p className="text-lg font-bold truncate">{stat.value}</p>
                                <p className={`text-xs ${stat.color}`}>{stat.change}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
