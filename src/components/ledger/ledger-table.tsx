
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LedgerEntry, Asset } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, ReceiptText } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

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
            return <ArrowUpRight className="h-4 w-4 text-red-500" />;
        case 'FEE':
            return <ReceiptText className="h-4 w-4 text-muted-foreground" />;
        default:
            return null;
    }
}

export function LedgerTable({ entries }: LedgerTableProps) {
    const firestore = useFirestore();
    const [assets, setAssets] = useState<Asset[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        const unsub = onSnapshot(query(collection(firestore, 'assets')), snapshot => {
            setAssets(snapshot.docs.map(doc => ({ ...doc.data() as Asset, id: doc.id })));
            setIsLoading(false);
        });
        return () => unsub();
    }, [firestore]);


    const assetsMap = useMemo(() => {
        if (!assets) return new Map();
        return new Map(assets.map(asset => [asset.id, asset]));
    }, [assets]);

    if (isLoading) {
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
            <TableHead className="w-[180px]">Date</TableHead>
            <TableHead className="w-[150px]">Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const asset = assetsMap.get(entry.assetId);
            const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date();
            const isCredit = ['DEPOSIT', 'TRADE_BUY'].includes(entry.type.toUpperCase());
            const isFee = entry.type.toUpperCase() === 'FEE';
            const amountColor = isCredit ? "text-green-500" : (isFee ? "text-muted-foreground" : "text-red-500");

            return (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground text-xs">
                  {entryDate.toLocaleString()}
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        {getTransactionIcon(entry.type)}
                        <Badge variant="secondary" className="capitalize">{entry.type.toLowerCase().replace('_', ' ')}</Badge>
                    </div>
                </TableCell>
                <TableCell className="text-sm">{entry.description || 'N/A'}</TableCell>
                <TableCell className={cn("text-right font-mono", amountColor)}>
                    {isCredit ? '+' : '-'} {entry.amount.toFixed(asset?.symbol === 'USDT' ? 2 : 8)} {asset?.symbol ?? ''}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
