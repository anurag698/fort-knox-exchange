'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import type { EnrichedMarket } from '@/app/markets/page';

interface EnhancedMarketsTableProps {
    markets: EnrichedMarket[];
}

type SortField = 'name' | 'price' | 'change' | 'volume';
type SortDirection = 'asc' | 'desc';

export function EnhancedMarketsTable({ markets }: EnhancedMarketsTableProps) {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [sortField, setSortField] = useState<SortField>('volume');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const toggleFavorite = (marketId: string) => {
        setFavorites(prev => {
            const newSet = new Set(prev);
            if (newSet.has(marketId)) {
                newSet.delete(marketId);
            } else {
                newSet.add(marketId);
            }
            return newSet;
        });
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedMarkets = useMemo(() => {
        return [...markets].sort((a, b) => {
            let aVal: number | string = 0;
            let bVal: number | string = 0;

            switch (sortField) {
                case 'name':
                    aVal = `${a.baseAssetId}/${a.quoteAssetId}`;
                    bVal = `${b.baseAssetId}/${b.quoteAssetId}`;
                    break;
                case 'price':
                    aVal = a.marketData?.price || 0;
                    bVal = b.marketData?.price || 0;
                    break;
                case 'change':
                    aVal = a.marketData?.priceChangePercent || 0;
                    bVal = b.marketData?.priceChangePercent || 0;
                    break;
                case 'volume':
                    aVal = a.marketData?.volume || 0;
                    bVal = b.marketData?.volume || 0;
                    break;
            }

            if (typeof aVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal as string)
                    : (bVal as string).localeCompare(aVal);
            }

            return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
        });
    }, [markets, sortField, sortDirection]);

    const SortButton = ({ field, label }: { field: SortField; label: string }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center gap-1 hover:text-primary transition-colors"
        >
            {label}
            <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
        </button>
    );

    return (
        <div className="rounded-lg border border-primary/10 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-card/80 to-card border-b border-primary/10 p-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                    <div className="col-span-1"></div> {/* Star column */}
                    <div className="col-span-3">
                        <SortButton field="name" label="Pair" />
                    </div>
                    <div className="col-span-2 text-right">
                        <SortButton field="price" label="Price" />
                    </div>
                    <div className="col-span-2 text-right">
                        <SortButton field="change" label="24h Change" />
                    </div>
                    <div className="col-span-2 text-right">
                        <SortButton field="volume" label="24h Volume" />
                    </div>
                    <div className="col-span-2 text-right">Action</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-primary/5">
                {sortedMarkets.map((market, index) => {
                    const isFavorite = favorites.has(market.id);
                    const changePercent = market.marketData?.priceChangePercent || 0;
                    const isPositive = changePercent >= 0;
                    const volume = (market.marketData?.volume || 0) * (market.marketData?.price || 0);

                    return (
                        <div
                            key={market.id}
                            className="grid grid-cols-12 gap-4 p-4 hover:bg-primary/5 transition-colors group animate-scale-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            {/* Favorite */}
                            <div className="col-span-1 flex items-center">
                                <button
                                    onClick={() => toggleFavorite(market.id)}
                                    className="hover:scale-110 transition-transform"
                                >
                                    <Star
                                        className={`h-4 w-4 ${isFavorite
                                                ? 'fill-yellow-500 text-yellow-500'
                                                : 'text-muted-foreground hover:text-yellow-500'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Pair */}
                            <div className="col-span-3 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-xs font-bold">
                                    {market.baseAssetId?.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold group-hover:text-primary transition-colors">
                                        {market.baseAssetId}/{market.quoteAssetId}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {market.baseAsset?.name || market.baseAssetId}
                                    </div>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="col-span-2 flex items-center justify-end">
                                <div className="text-right">
                                    <div className="font-mono font-bold">
                                        ${market.marketData?.price?.toFixed(market.pricePrecision || 2) || '0.00'}
                                    </div>
                                </div>
                            </div>

                            {/* 24h Change */}
                            <div className="col-span-2 flex items-center justify-end">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    <span className="text-sm font-bold">
                                        {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>

                            {/* 24h Volume */}
                            <div className="col-span-2 flex items-center justify-end">
                                <div className="text-right">
                                    <div className="font-mono text-sm">
                                        ${(volume / 1000000).toFixed(2)}M
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="col-span-2 flex items-center justify-end">
                                <Button
                                    size="sm"
                                    variant="gradient"
                                    asChild
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Link href={`/trade/${market.id}`}>
                                        Trade
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sortedMarkets.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                    No markets found matching your criteria
                </div>
            )}
        </div>
    );
}
