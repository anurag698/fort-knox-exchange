
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Market, Asset } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
  price: number;
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
            <TableHead className="text-right">24h Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            const isPositive = market.change >= 0;

            return (
              <TableRow key={market.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{market.baseAsset?.symbol ?? '...'}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{market.quoteAsset?.symbol ?? '...'}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("font-mono", market.price > 0 ? (isPositive ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground')}>
                  {market.price > 0 ? `$${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: market.pricePrecision})}` : <Skeleton className="h-4 w-20" />}
                </TableCell>
                <TableCell className={cn("flex items-center gap-1", isPositive ? 'text-green-600' : 'text-red-600')}>
                  {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {market.change.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right font-mono">${market.volume.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
