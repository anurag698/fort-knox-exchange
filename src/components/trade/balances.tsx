
// This component displays the user's available balances for the base and quote assets of the current market.
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { Wallet, AlertCircle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useBalances } from '@/hooks/use-balances';
import { useMarkets } from '@/hooks/use-markets';
import { useAssets } from '@/hooks/use-assets';

export function Balances({ marketId }: { marketId: string }) {
  const { data: balances, isLoading: balancesLoading } = useBalances();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: markets, isLoading: marketsLoading } = useMarkets();

  const isLoading = balancesLoading || assetsLoading || marketsLoading;

  const { baseAsset, quoteAsset, baseBalance, quoteBalance } = useMemo(() => {
    const market = markets?.find(m => m.id === marketId);
    if (!market || !assets || !balances) return { baseAsset: null, quoteAsset: null, baseBalance: null, quoteBalance: null };
    const baseAsset = assets.find(a => a.id === market.baseAssetId);
    const quoteAsset = assets.find(a => a.id === market.quoteAssetId);
    const baseBalance = balances.find(b => b.assetId === market.baseAssetId);
    const quoteBalance = balances.find(b => b.assetId === market.quoteAssetId);
    return { baseAsset, quoteAsset, baseBalance, quoteBalance };
  }, [marketId, markets, assets, balances]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2 p-3">
          <Skeleton className="h-12 w-full animate-shimmer" />
          <Skeleton className="h-12 w-full animate-shimmer" />
        </div>
      );
    }
    if (!baseAsset || !quoteAsset) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary/50" />
          </div>
          <p className="text-xs">Log in to view assets</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 p-3">
        {/* Base Asset */}
        <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/30 transition-all group">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xs font-bold text-primary">{baseAsset.symbol[0]}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">{baseAsset.symbol}</span>
              <span className="text-[10px] text-muted-foreground">{baseAsset.name}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono text-sm font-bold">{(baseBalance?.available ?? 0).toFixed(6)}</span>
            <span className="text-[10px] text-muted-foreground">Available</span>
          </div>
        </div>

        {/* Quote Asset */}
        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all group">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xs font-bold">{quoteAsset.symbol[0]}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">{quoteAsset.symbol}</span>
              <span className="text-[10px] text-muted-foreground">{quoteAsset.name}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono text-sm font-bold">{(quoteBalance?.available ?? 0).toFixed(2)}</span>
            <span className="text-[10px] text-muted-foreground">Available</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="px-3 py-2.5 bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border-b border-primary/20">
        <span className="text-xs font-semibold flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          Assets
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {renderContent()}
      </div>
    </div>
  );
}
