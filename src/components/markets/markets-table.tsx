
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

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  marketData?: MarketData;
};

type MarketsTableProps = {
  markets: EnrichedMarket[];
};

export function MarketsTable({ markets }: MarketsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Market</TableHead>
            <TableHead>Last Price</TableHead>
            <TableHead>24h Change</TableHead>
            <TableHead>24h High</TableHead>
            <TableHead>24h Low</TableHead>
            <TableHead>24h Volume</TableHead>
            <TableHead>Sparkline</TableHead>
             <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            const data = market.marketData;
            const priceChangeColor = data && data.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500';

            return (
              <TableRow key={market.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{market.baseAsset?.symbol ?? '...'}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{market.quoteAsset?.symbol ?? '...'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{market.baseAsset?.name}</div>
                </TableCell>
                <TableCell className={cn("font-mono", priceChangeColor)}>
                  {data ? data.price.toFixed(market.pricePrecision) : <Skeleton className="h-4 w-20" />}
                </TableCell>
                <TableCell className={priceChangeColor}>
                  {data ? `${data.priceChangePercent.toFixed(2)}%` : <Skeleton className="h-4 w-12" />}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                    {data ? data.high.toFixed(market.pricePrecision) : <Skeleton className="h-4 w-20" />}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                    {data ? data.low.toFixed(market.pricePrecision) : <Skeleton className="h-4 w-20" />}
                </TableCell>
                <TableCell className="font-mono">
                  {data ? `${data.volume.toFixed(0)}` : <Skeleton className="h-4 w-24" />}
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                 <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
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
