
'use client';

import React, { useEffect, useState } from 'react';
import { useMarketDataStore } from '@/state/market-data-store';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useMarkets } from '@/hooks/use-markets';
import { useAssets } from '@/hooks/use-assets';
import { useRouter } from 'next/navigation';
import { coinIcons } from '@/components/markets/markets-table';
import type { MarketData } from '@/lib/types';
import { LiveDataIndicator } from './live-data-indicator';


interface MarketHeaderProps {
  marketId: string;
}

export function MarketHeader({ marketId }: MarketHeaderProps) {
  const router = useRouter();
  const { data: markets, isLoading: marketsLoading } = useMarkets();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const [open, setOpen] = useState(false);
  const tickerMap = useMarketDataStore((s) => s.ticker);
  const normalizedId = marketId.replace('-', '').toUpperCase();
  const ticker = tickerMap[normalizedId] || tickerMap[marketId];

  useEffect(() => {
    if (ticker) console.log('[MarketHeader] Ticker Update:', ticker);
  }, [ticker]);

  const [flash, setFlash] = useState("");
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  useEffect(() => {
    if (ticker?.price) {
      const newPrice = ticker.price;
      if (lastPrice !== null && newPrice !== lastPrice) {
        setFlash(newPrice > lastPrice ? 'flash-green' : 'flash-red');
        const t = setTimeout(() => setFlash(''), 400);
        return () => clearTimeout(t);
      }
      setLastPrice(newPrice);
    }
  }, [ticker?.price, lastPrice]);


  const assetsMap = new Map(assets?.map(a => [a.id, a]));
  const currentMarket = markets?.find(m => m.id === marketId);
  const baseAsset = currentMarket ? assetsMap.get(currentMarket.baseAssetId) : null;
  const quoteAsset = currentMarket ? assetsMap.get(currentMarket.quoteAssetId) : null;
  const BaseIcon = baseAsset ? coinIcons[baseAsset.symbol] || coinIcons.DEFAULT : coinIcons.DEFAULT;

  const handleMarketSelect = (newMarketId: string) => {
    router.push(`/trade/${newMarketId}`);
    setOpen(false);
  };

  if (marketsLoading || assetsLoading) {
    return <Skeleton className="h-8 w-48 animate-shimmer" />;
  }

  const priceChangePercent = ticker?.change ? ticker.change : 0;
  const priceColor = priceChangePercent > 0 ? 'text-green-500' : priceChangePercent < 0 ? 'text-red-500' : 'text-foreground';
  const priceChangeValue = ticker?.price && ticker?.change ? (ticker.price * (ticker.change / 100)) : 0;

  return (
    <div className="flex items-center h-full gap-4 px-4 glass border-b border-primary/10 animate-slide-in-down">
      {/* MARKET SELECTOR with Premium Style */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="h-auto px-3 py-2 hover:bg-primary/10 gap-2 rounded-lg border border-transparent hover:border-primary/30 transition-all"
          >
            {baseAsset ? (
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  {typeof BaseIcon === 'string' ? (
                    <AvatarImage src={BaseIcon as string} alt={baseAsset.name} />
                  ) : (
                    <BaseIcon className="h-8 w-8" />
                  )}
                  <AvatarFallback>{baseAsset.symbol.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="font-bold text-base font-sora">{baseAsset.symbol}/{quoteAsset?.symbol}</span>
                  <span className="text-[10px] text-muted-foreground">Bitcoin</span>
                </div>
              </div>
            ) : "Select Market..."}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 glass">
          <Command>
            <CommandInput placeholder="Search market..." />
            <CommandList>
              <CommandEmpty>No market found.</CommandEmpty>
              <CommandGroup>
                {markets?.map(market => (
                  <CommandItem
                    key={market.id}
                    value={market.id}
                    onSelect={() => handleMarketSelect(market.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        marketId === market.id ? 'opacity-100 text-primary' : 'opacity-0'
                      )}
                    />
                    {market.id}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Divider */}
      <div className="h-12 w-px bg-border/50" />

      {/* TICKER STATS with Premium Cards */}
      <div className="flex items-center gap-4 text-xs flex-1">

        {/* PRICE - Highlighted Card */}
        <div className="flex flex-col justify-center gap-0.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <span className={cn("text-xl font-bold font-mono transition-all", flash || priceColor)}>
            {ticker?.price != null ? ticker.price.toFixed(currentMarket?.pricePrecision || 2) : "---"}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            ${ticker?.price != null ? ticker.price.toFixed(2) : "---"}
          </span>
        </div>

        {/* 24h CHANGE - Dynamic Color Card */}
        <div className="flex flex-col justify-center gap-0.5 px-3 py-1.5 rounded-lg bg-muted/20">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            {priceChangePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            24h Change
          </span>
          <span className={cn("font-mono font-bold text-sm", priceColor)}>
            {ticker?.change != null ? `${priceChangePercent > 0 ? '+' : ''}${priceChangeValue.toFixed(2)} ${priceChangePercent.toFixed(2)}%` : "---"}
          </span>
        </div>

        {/* 24h HIGH */}
        <div className="flex flex-col justify-center gap-0.5 px-3 py-1.5 hidden lg:flex">
          <span className="text-[10px] text-muted-foreground">24h High</span>
          <span className="text-foreground font-mono font-medium">
            {ticker?.high != null ? ticker.high.toFixed(currentMarket?.pricePrecision || 2) : "---"}
          </span>
        </div>

        {/* 24h LOW */}
        <div className="flex flex-col justify-center gap-0.5 px-3 py-1.5 hidden lg:flex">
          <span className="text-[10px] text-muted-foreground">24h Low</span>
          <span className="text-foreground font-mono font-medium">
            {ticker?.low != null ? ticker.low.toFixed(currentMarket?.pricePrecision || 2) : "---"}
          </span>
        </div>

        {/* 24h VOL (Base) */}
        <div className="flex flex-col justify-center gap-0.5 px-3 py-1.5 hidden xl:flex rounded-lg bg-muted/10">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" />
            24h Vol({baseAsset?.symbol})
          </span>
          <span className="text-foreground font-mono font-medium">
            {ticker?.volume != null ? ticker.volume.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "---"}
          </span>
        </div>

        {/* 24h VOL (Quote) - Simulated/Calculated */}
        <div className="flex flex-col justify-center gap-0.5 px-3 py-1.5 hidden xl:flex rounded-lg bg-muted/10">
          <span className="text-[10px] text-muted-foreground">24h Vol({quoteAsset?.symbol})</span>
          <span className="text-foreground font-mono font-medium">
            {ticker?.volume != null && ticker?.price != null ? (ticker.volume * ticker.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "---"}
          </span>
        </div>
      </div>

      {/* Live Data Indicator */}
      <div className="hidden xl:block">
        <LiveDataIndicator />
      </div>
    </div>
  );
}
