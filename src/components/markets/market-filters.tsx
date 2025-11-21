'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Star, TrendingUp, TrendingDown, Volume2, Zap, Gamepad2, ShoppingBag, Music } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MarketFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    showFavoritesOnly: boolean;
    onToggleFavorites: () => void;
}

const categories = [
    { id: 'all', label: 'All Markets', icon: Zap },
    { id: 'defi', label: 'DeFi', icon: TrendingUp },
    { id: 'nft', label: 'NFT & Gaming', icon: Gamepad2 },
    { id: 'metaverse', label: 'Metaverse', icon: ShoppingBag },
    { id: 'meme', label: 'Meme', icon: Music },
    { id: 'layer1', label: 'Layer 1', icon: Volume2 },
];

export function MarketFilters({
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    showFavoritesOnly,
    onToggleFavorites,
}: MarketFiltersProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search markets (e.g., BTC, ETH, DOGE...)"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 bg-card/50 border-primary/20 focus:border-primary transition-colors"
                    />
                </div>
                <Button
                    variant={showFavoritesOnly ? 'default' : 'outline'}
                    onClick={onToggleFavorites}
                    className="gap-2"
                >
                    <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    Favorites
                </Button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {categories.map((category) => (
                    <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onCategoryChange(category.id)}
                        className={`flex-shrink-0 gap-2 ${selectedCategory === category.id
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'hover-lift'
                            }`}
                    >
                        <category.icon className="h-4 w-4" />
                        {category.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
