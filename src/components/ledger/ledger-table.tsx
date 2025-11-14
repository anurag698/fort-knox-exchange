
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LedgerEntry } from '@/lib/types';
import { useAssets } from '@/hooks/use-assets';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

type LedgerTableProps = {
  entries: LedgerEntry[];
};

const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
        case 'DEPOSIT':
        case 'TRADE_BUY':
            return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
        case 'WITHDRAWAL':
        case 'TRADE_SELL':
        case 'FEE':
            return <ArrowUpRight className="h-4 w-4 text-red-500" />;
        default:
            return null;
    }
}

export function LedgerTable({ entries }: LedgerTableProps) {
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
            <TableHead className="w-[150px]">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const asset = assetsMap.get(entry.assetId);
            const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date();
            const isCredit = ['DEPOSIT', 'TRADE_BUY'].includes(entry.type.toUpperCase());

            return (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground text-xs">
                  {entryDate.toLocaleString()}
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        {getTransactionIcon(entry.type)}
                        <Badge variant="secondary">{entry.type}</Badge>
                    </div>
                </TableCell>
                <TableCell className="text-sm">{entry.description || 'N/A'}</TableCell>
                <TableCell className={cn("text-right font-mono", isCredit ? "text-green-600" : "text-red-600")}>
                    {isCredit ? '+' : '-'} {entry.amount.toFixed(8)} {asset?.symbol ?? ''}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
