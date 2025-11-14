'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Market } from '@/lib/types';
import { useAssets } from '@/hooks/use-assets';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type MarketsTableProps = {
  markets: Market[];
};

export function MarketsTable({ markets }: MarketsTableProps) {
    const { data: assets, isLoading: assetsLoading } = useAssets();

    const assetsMap = useMemo(() => {
        if (!assets) return new Map();
        return new Map(assets.map(asset => [asset.id, asset]));
    }, [assets]);

    if (assetsLoading) {
      return (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      );
    }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Market</TableHead>
            <TableHead>Maker Fee</TableHead>
            <TableHead>Taker Fee</TableHead>
            <TableHead className="text-right">Min. Order Size</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            const baseAsset = assetsMap.get(market.baseAssetId);
            const quoteAsset = assetsMap.get(market.quoteAssetId);

            return (
              <TableRow key={market.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{baseAsset?.symbol ?? '...'}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{quoteAsset?.symbol ?? '...'}</span>
                  </div>
                </TableCell>
                <TableCell>{(market.makerFee * 100).toFixed(2)}%</TableCell>
                <TableCell>{(market.takerFee * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-right">{market.minOrderSize.toLocaleString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
