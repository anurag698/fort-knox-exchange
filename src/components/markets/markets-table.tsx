
'use client';

import type { Market, Asset, MarketData } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Bitcoin, Circle } from 'lucide-react';

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  marketData?: MarketData;
};

type MarketsTableProps = {
  markets: EnrichedMarket[];
};

// Mock icons for coins - you would replace these with real image URLs
const coinIcons: { [key: string]: React.ElementType | string } = {
  BTC: Bitcoin,
  ETH: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/eth.png',
  USDT: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/usdt.png',
  SOL: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/sol.png',
  ADA: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/ada.png',
  MATIC: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/matic.png',
  DOGE: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/doge.png',
  XRP: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/xrp.png',
  DOT: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/dot.png',
  LINK: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/link.png',
  SHIB: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/shib.png',
  AVAX: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/avax.png',
  LTC: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/ltc.png',
  TRX: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/trx.png',
  UNI: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530e6e374711a8de441d91584965e5441c4a/128/color/uni.png',
  DEFAULT: Circle,
};


export function MarketsTable({ markets }: MarketsTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">24h Change</TableHead>
            <TableHead className="text-right">24h Volume</TableHead>
            <TableHead className="text-right">Market Cap</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            const data = market.marketData;
            const priceChangeColor = data && data.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500';
            const Icon = coinIcons[market.baseAsset?.symbol || 'DEFAULT'] || coinIcons.DEFAULT;
            const marketCap = (data?.price || 0) * (data?.volume || 0); // Simplified market cap

            return (
              <TableRow key={market.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                     <Avatar className="h-8 w-8">
                       {typeof Icon === 'string' ? (
                        <AvatarImage src={Icon} alt={market.baseAsset?.name} />
                      ) : (
                        <Icon className="h-8 w-8" />
                      )}
                      <AvatarFallback>{market.baseAsset?.symbol.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium flex items-center gap-2">
                      <span className="font-bold">{market.baseAsset?.symbol ?? '...'}</span>
                      <span className="text-muted-foreground">{market.baseAsset?.name}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cn("font-mono text-right")}>
                  {data ? `$${data.price.toFixed(market.pricePrecision)}` : <Skeleton className="h-4 w-20 ml-auto" />}
                </TableCell>
                <TableCell className={cn("font-mono text-right", priceChangeColor)}>
                  {data ? `${data.priceChangePercent >= 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%` : <Skeleton className="h-4 w-12 ml-auto" />}
                </TableCell>
                <TableCell className="font-mono text-right">
                    {data ? `$${(data.volume * data.price / 1_000_000).toFixed(2)}M` : <Skeleton className="h-4 w-20 ml-auto" />}
                </TableCell>
                <TableCell className="font-mono text-right">
                  {data ? `$${(marketCap / 1_000_000_000).toFixed(2)}B` : <Skeleton className="h-4 w-24 ml-auto" />}
                </TableCell>
                 <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                      <Link href={`/trade/${market.id}`}>Trade</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
