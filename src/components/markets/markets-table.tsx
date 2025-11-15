
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Market, Asset } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type EnrichedMarket = Market & {
  baseAsset?: Asset;
  quoteAsset?: Asset;
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
          {markets.map((market) => (
            <TableRow key={market.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{market.baseAsset?.symbol ?? '...'}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">{market.quoteAsset?.symbol ?? '...'}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell className="text-right font-mono">
                <Skeleton className="h-4 w-24 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
