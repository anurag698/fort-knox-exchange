'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMarketDataStore } from '@/state/market-data-store';
import { useMarkets } from '@/hooks/use-markets';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';

export function FeaturedMarketsGrid() {
    const marketData = useMarketDataStore(state => state.ticker);
    const { data: markets } = useMarkets();

    const topMarkets = useMemo(() => {
        if (!markets || !marketData) return [];

        // Get top 9 markets by volume
        return markets
            .map(market => ({
                ...market,
                ticker: marketData[market.id]
            }))
            .filter(m => m.ticker?.volume)
            .sort((a, b) => (b.ticker?.volume || 0) - (a.ticker?.volume || 0))
            .slice(0, 9);
    }, [markets, marketData]);

    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-background/50">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            Top Trading Pairs
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Live prices updated every second
                        </p>
                    </div>
                    <Button variant="gradient" size="lg" asChild className="mt-4 md:mt-0 group">
                        <Link href="/markets">
                            View All Markets
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topMarkets.map((market, index) => {
                        const ticker = market.ticker;
                        const changePercent = ticker?.changePercent || 0;
                        const isPositive = changePercent >= 0;

                        return (
                            <Card
                                key={market.id}
                                variant="glass"
                                className="p-4 hover-lift cursor-pointer group animate-scale-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <Link href={`/trade/${market.id}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                                                {market.baseAssetId}/{market.quoteAssetId}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Vol: ${((ticker?.volume || 0) * (ticker?.price || 0) / 1000000).toFixed(2)}M
                                            </p>
                                        </div>
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                            {isPositive ? (
                                                <TrendingUp className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 text-red-500" />
                                            )}
                                            <span className={`text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-2xl font-bold font-mono">
                                                ${ticker?.price?.toFixed(market.pricePrecision || 2) || '0.00'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                24h: ${ticker?.change?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                        <div className="h-8 flex items-end gap-0.5">
                                            {/* Mini sparkline placeholder */}
                                            {[...Array(8)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1 rounded-t ${isPositive ? 'bg-green-500/30' : 'bg-red-500/30'}`}
                                                    style={{ height: `${Math.random() * 100}%` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
