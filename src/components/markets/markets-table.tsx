
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

export function MarketsTable({ markets: initialMarkets }: MarketsTableProps) {
    const { data: assets, isLoading: assetsLoading } = useAssets();
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [pricesLoading, setPricesLoading] = useState(true);

    useEffect(() => {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade/adausdt@trade');
        
        ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data && data.s && data.p) {
            setPrices(prevPrices => ({
            ...prevPrices,
            [data.s.replace('USDT', '')]: parseFloat(data.p),
            }));
        }
        };

        ws.onopen = () => {
            setPricesLoading(false);
        }

        return () => {
        ws.close();
        };
  }, []);

    const assetsMap = useMemo(() => {
        if (!assets) return new Map();
        return new Map(assets.map(asset => [asset.id, asset]));
    }, [assets]);
    
    // Add mock data for 24h change and volume
    const markets = useMemo(() => {
        if (!initialMarkets) return [];
        return initialMarkets.map(market => ({
            ...market,
            change: (market.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1, 
            volume: (market.id.charCodeAt(1) % 100) * 100000 + Math.random() * 50000,
        }));
    }, [initialMarkets]);

    const isLoading = assetsLoading || pricesLoading;

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
            <TableHead className="w-[200px]">Market</TableHead>
            <TableHead>Last Price</TableHead>
            <TableHead>24h Change</TableHead>
            <TableHead className="text-right">24h Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => {
            const baseAsset = assetsMap.get(market.baseAssetId);
            const quoteAsset = assetsMap.get(market.quoteAssetId);
            const price = baseAsset ? prices?.[baseAsset.symbol] : 0;
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
                <TableCell className={cn("font-mono", isPositive ? 'text-green-600' : 'text-red-600')}>
                    ${price?.toLocaleString() ?? '...'}
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
