
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
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

type MarketsTableProps = {
  markets: Market[];
};

export function MarketsTable({ markets }: MarketsTableProps) {
    const { data: assets, isLoading: assetsLoading } = useAssets();
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [pricesLoading, setPricesLoading] = useState(true);

    const enrichedMarkets = useMemo(() => {
        if (!markets) return [];
        return markets.map(market => ({
            ...market,
            change: (market.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1, 
            volume: (market.id.charCodeAt(1) % 100) * 100000 + Math.random() * 50000,
        }));
    }, [markets]);

    const marketSymbols = useMemo(() => {
        return markets.map(m => `${m.baseAssetId}${m.quoteAssetId}`);
    }, [markets]);

    useEffect(() => {
        if (marketSymbols.length === 0) {
            setPricesLoading(false);
            return;
        }
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${marketSymbols.map(s => `${s.toLowerCase()}@trade`).join('/')}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data && data.s && data.p) {
                setPrices(prevPrices => ({
                ...prevPrices,
                [data.s]: parseFloat(data.p),
                }));
            }
        };

        ws.onopen = () => {
            setPricesLoading(false);
        }
        
        ws.onerror = (err) => {
            console.error("MarketsTable WebSocket error:", err);
            setPricesLoading(false);
        }

        return () => {
          ws.close();
        };
    }, [marketSymbols]);

    const assetsMap = useMemo(() => {
        if (!assets) return new Map();
        return new Map(assets.map(asset => [asset.id, asset]));
    }, [assets]);
    
    const isLoading = assetsLoading || pricesLoading;

    if (isLoading && (!enrichedMarkets || enrichedMarkets.length === 0)) {
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
            <TableHead>Last Price</TableHead>
            <TableHead>24h Change</TableHead>
            <TableHead className="text-right">24h Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrichedMarkets.map((market) => {
            const baseAsset = assetsMap.get(market.baseAssetId) ?? { symbol: market.baseAssetId };
            const quoteAsset = assetsMap.get(market.quoteAssetId) ?? { symbol: market.quoteAssetId };
            const price = prices[`${market.baseAssetId}${market.quoteAssetId}`] ?? 0;
            const isPositive = market.change >= 0;

            return (
              <TableRow key={market.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{baseAsset?.symbol ?? '...'}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{quoteAsset?.symbol ?? '...'}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("font-mono", price > 0 ? (isPositive ? 'text-green-600' : 'text-red-600') : 'text-muted-foreground')}>
                    {price > 0 ? `$${price?.toLocaleString()}` : '...'}
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
