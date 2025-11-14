
'use client';

import { useBalances } from '@/hooks/use-balances';
import { useAssets } from '@/hooks/use-assets';
import { usePrices } from '@/hooks/use-prices';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Wallet } from 'lucide-react';
import { PortfolioTable } from '@/components/portfolio/portfolio-table';
import { PortfolioOverview } from '@/components/portfolio/portfolio-overview';
import { useMemo } from 'react';

export default function PortfolioPage() {
  const { data: balances, isLoading: balancesLoading } = useBalances();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: prices, isLoading: pricesLoading } = usePrices();

  const isLoading = balancesLoading || assetsLoading || pricesLoading;

  const portfolioData = useMemo(() => {
    if (isLoading || !balances || !assets || !prices) {
      return [];
    }

    const assetsMap = new Map(assets.map(a => [a.id, a]));
    
    return balances.map(balance => {
      const asset = assetsMap.get(balance.assetId);
      const price = prices[asset?.symbol || ''] || 0;
      const value = balance.available * price;
      return {
        ...balance,
        asset,
        price,
        value
      };
    }).filter(item => item.asset); // Filter out items where asset was not found
  }, [balances, assets, prices, isLoading]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (!balances || balances.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Your Wallet is Empty</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Make a deposit to start building your portfolio.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
            <PortfolioOverview data={portfolioData} />
        </div>
        <div className="lg:col-span-3">
             <PortfolioTable data={portfolioData} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
       <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          My Portfolio
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          An overview of your asset holdings and their current value.
        </p>
      </div>
      {renderContent()}
    </div>
  );
}
