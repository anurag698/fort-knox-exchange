
'use client';

import { useState, useEffect } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMarkets } from '@/hooks/use-markets';
import type { MarketData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useAssets } from '@/hooks/use-assets';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { coinIcons } from '@/components/markets/markets-table';
import { useMarketDataStore } from '@/hooks/use-market-data-store';

interface MarketHeaderProps {
  marketId: string;
}

export function MarketHeader({ marketId }: MarketHeaderProps) {
  const router = useRouter();
  const { data: markets, isLoading: marketsLoading } = useMarkets();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const [open, setOpen] = useState(false);
  const ticker = useMarketDataStore(state => state.tickers[marketId.replace('-', '').toLowerCase()]);

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
    return <Skeleton className="h-12 w-full" />;
  }

  const marketData: MarketData | null = ticker ? {
    id: marketId,
    price: ticker.price,
    priceChangePercent: ticker.priceChangePercent,
    high: ticker.high,
    low: ticker.low,
    volume: ticker.volume,
    marketCap: 0, // Not available from this stream
    lastUpdated: new Date(ticker.eventTime),
  } : null;

  return (
    <div className="flex items-center gap-4 border-b pb-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-[250px] justify-between h-14"
          >
             {baseAsset ? (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                       {typeof BaseIcon === 'string' ? (
                        <AvatarImage src={BaseIcon} alt={baseAsset.name} />
                      ) : (
                        <BaseIcon className="h-8 w-8" />
                      )}
                      <AvatarFallback>{baseAsset.symbol.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                     <div>
                        <p className="font-bold text-lg">{baseAsset.symbol}/{quoteAsset?.symbol}</p>
                        <p className="text-xs text-muted-foreground text-left">{baseAsset.name}</p>
                    </div>
                </div>
            ) : "Select Market..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
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
                                marketId === market.id ? 'opacity-100' : 'opacity-0'
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

      <div className="flex items-center gap-6 text-sm">
        <div>
            <p className="text-muted-foreground">Last Price</p>
            {marketData ? (
                <p className={cn("font-semibold text-lg", marketData.priceChangePercent >= 0 ? "text-green-500" : "text-red-500")}>
                    {marketData.price.toFixed(currentMarket?.pricePrecision || 2)}
                </p>
            ) : <Skeleton className="h-6 w-24 mt-1" />}
        </div>
         <div>
            <p className="text-muted-foreground">24h Change</p>
            {marketData ? (
                <p className={cn("font-semibold", marketData.priceChangePercent >= 0 ? "text-green-500" : "text-red-500")}>
                    {marketData.priceChangePercent.toFixed(2)}%
                </p>
            ) : <Skeleton className="h-5 w-16 mt-1" />}
        </div>
        <div>
            <p className="text-muted-foreground">24h High</p>
            {marketData ? <p className="font-mono">{marketData.high.toFixed(currentMarket?.pricePrecision || 2)}</p> : <Skeleton className="h-5 w-20 mt-1" />}
        </div>
        <div>
            <p className="text-muted-foreground">24h Low</p>
            {marketData ? <p className="font-mono">{marketData.low.toFixed(currentMarket?.pricePrecision || 2)}</p> : <Skeleton className="h-5 w-20 mt-1" />}
        </div>
         <div>
            <p className="text-muted-foreground">24h Volume({baseAsset?.symbol})</p>
            {marketData ? <p className="font-mono">{marketData.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p> : <Skeleton className="h-5 w-24 mt-1" />}
        </div>
      </div>
    </div>
  );
}
