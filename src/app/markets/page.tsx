
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, Asset, MarketData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EnhancedMarketsTable } from '@/components/markets/enhanced-markets-table';
import { MarketFilters } from '@/components/markets/market-filters';
import { DatabaseZap, TrendingUp, Users, BarChart3, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MarketStatCard } from '@/components/markets/market-stat-card';
import Link from 'next/link';
import { useAssets } from '@/hooks/use-assets';
import { useMarkets } from '@/hooks/use-markets';
import useSWR from 'swr';

export type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  marketData?: MarketData;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Category mappings (simplified - in production, this would come from market metadata)
const marketCategories: Record<string, string[]> = {
  defi: ['UNI', 'AAVE', 'COMP', 'MKR', 'SNX', 'CRV'],
  nft: ['APE', 'SAND', 'MANA', 'AXS', 'ENJ'],
  metaverse: ['SAND', 'MANA', 'RACA', 'GALA'],
  meme: ['DOGE', 'SHIB', 'FLOKI', 'PEPE'],
  layer1: ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'MATIC'],
};

export default function MarketsPage() {
  const { data: markets, isLoading: marketsLoading, error: marketsError } = useMarkets();
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  const { data: marketData, isLoading: marketDataLoading, error: marketDataError } = useSWR<Record<string, MarketData>>(
    '/api/market-data',
    fetcher,
    { refreshInterval: 5000 }
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const isLoading = marketsLoading || assetsLoading || marketDataLoading;
  const error = marketsError || assetsError || marketDataError;

  const enrichedMarkets: EnrichedMarket[] = useMemo(() => {
    if (!markets || !assets) {
      return [];
    }
    const assetsMap = new Map(assets.map(asset => [asset.id, asset]));

    return markets.map(market => ({
      ...market,
      baseAsset: assetsMap.get(market.baseAssetId),
      quoteAsset: assetsMap.get(market.quoteAssetId),
      marketData: marketData?.[market.id],
    }));
  }, [markets, assets, marketData]);

  const filteredMarkets = useMemo(() => {
    let filtered = enrichedMarkets.filter(m => m.quoteAssetId === 'USDT');

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.baseAssetId.toLowerCase().includes(search) ||
        m.baseAsset?.name?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      const categoryAssets = marketCategories[selectedCategory] || [];
      filtered = filtered.filter(m => categoryAssets.includes(m.baseAssetId));
    }

    return filtered;
  }, [enrichedMarkets, searchTerm, selectedCategory]);

  const usdtMarkets = useMemo(() => enrichedMarkets.filter(m => m.quoteAssetId === 'USDT'), [enrichedMarkets]);

  const topGainers = useMemo(() => {
    return [...usdtMarkets]
      .filter(m => m.marketData?.priceChangePercent)
      .sort((a, b) => (b.marketData?.priceChangePercent || 0) - (a.marketData?.priceChangePercent || 0))
      .slice(0, 4);
  }, [usdtMarkets]);

  const topVolume = useMemo(() => {
    return [...usdtMarkets]
      .filter(m => m.marketData?.volume)
      .sort((a, b) => (b.marketData?.volume || 0) - (a.marketData?.volume || 0))
      .slice(0, 4);
  }, [usdtMarkets]);

  const hotList = useMemo(() => {
    return [...usdtMarkets]
      .filter(m => m.marketData?.volume && m.marketData?.priceChangePercent)
      .sort((a, b) => ((b.marketData?.volume || 0) * Math.abs(b.marketData?.priceChangePercent || 0)) - ((a.marketData?.volume || 0) * Math.abs(a.marketData?.priceChangePercent || 0)))
      .slice(0, 4);
  }, [usdtMarkets]);

  const newTokens = useMemo(() => {
    return [...usdtMarkets]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 4);
  }, [usdtMarkets]);

  // Calculate total stats
  const totalVolume = useMemo(() => {
    return usdtMarkets.reduce((sum, m) => {
      const volume = (m.marketData?.volume || 0) * (m.marketData?.price || 0);
      return sum + volume;
    }, 0);
  }, [usdtMarkets]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Markets</AlertTitle>
          <AlertDescription>
            {error.message || "Could not fetch market data."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isLoading && (!markets || markets.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <DatabaseZap className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Database Not Initialized</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            The exchange requires initial data for assets and markets. Please use the "Update Data" page to seed the database.
          </p>
          <Button asChild>
            <Link href="/seed-data">Go to Update Data Page</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/10 to-background py-16 border-b border-primary/10">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Explore Markets
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Trade 100+ cryptocurrency pairs with real-time data and advanced tools
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="glass" className="p-4 hover-lift">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">24h Volume</p>
                    <p className="text-lg font-bold">${(totalVolume / 1000000).toFixed(2)}M</p>
                  </div>
                </div>
              </Card>
              <Card variant="glass" className="p-4 hover-lift">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Markets</p>
                    <p className="text-lg font-bold">{usdtMarkets.length}</p>
                  </div>
                </div>
              </Card>
              <Card variant="glass" className="p-4 hover-lift">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Traders</p>
                    <p className="text-lg font-bold">150K+</p>
                  </div>
                </div>
              </Card>
              <Card variant="glass" className="p-4 hover-lift">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Zap className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trading Fee</p>
                    <p className="text-lg font-bold">0.1%</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MarketStatCard title="🔥 Hot" markets={hotList} isLoading={isLoading} />
          <MarketStatCard title="📈 Top Gainers" markets={topGainers} isLoading={isLoading} />
          <MarketStatCard title="💹 Top Volume" markets={topVolume} isLoading={isLoading} />
          <MarketStatCard title="✨ New Listings" markets={newTokens} isLoading={isLoading} />
        </div>

        {/* Filters */}
        <Card variant="glass" className="p-6 mb-6">
          <MarketFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
          />
        </Card>

        {/* Markets Table */}
        <Card variant="glass" className="p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-1">All Markets</h2>
            <p className="text-sm text-muted-foreground">
              {filteredMarkets.length} markets • Updated every 5 seconds
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <EnhancedMarketsTable markets={filteredMarkets} />
          )}
        </Card>
      </div>
    </div>
  );
}
