
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useBalances } from '@/hooks/use-balances';
import { useMarkets } from '@/hooks/use-markets';
import { useAssets } from '@/hooks/use-assets';

export function Balances({ marketId }: { marketId: string }) {
  const { data: balances, isLoading: balancesLoading, error: balancesError } = useBalances();
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  const { data: markets, isLoading: marketsLoading, error: marketsError } = useMarkets();
  
  const isLoading = balancesLoading || assetsLoading || marketsLoading;
  const error = balancesError || assetsError || marketsError;
  
  const { baseAsset, quoteAsset, baseBalance, quoteBalance } = useMemo(() => {
    const market = markets?.find(m => m.id === marketId);
    if (!market || !assets || !balances) {
      return { baseAsset: null, quoteAsset: null, baseBalance: null, quoteBalance: null };
    }

    const baseAsset = assets.find(a => a.id === market.baseAssetId);
    const quoteAsset = assets.find(a => a.id === market.quoteAssetId);

    const baseBalance = balances.find(b => b.assetId === market.baseAssetId);
    const quoteBalance = balances.find(b => b.assetId === market.quoteAssetId);

    return { baseAsset, quoteAsset, baseBalance, quoteBalance };
  }, [marketId, markets, assets, balances]);


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      );
    }

    if (error) {
       return (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
              Failed to load balances.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!baseAsset || !quoteAsset) {
        return <p className="text-xs text-muted-foreground">Market data not available.</p>
    }

    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{baseAsset.symbol} Balance</span>
          <span className="font-mono font-medium">
            {(baseBalance?.available ?? 0).toFixed(6)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{quoteAsset.symbol} Balance</span>
          <span className="font-mono font-medium">
            {(quoteBalance?.available ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <span>Balances</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
