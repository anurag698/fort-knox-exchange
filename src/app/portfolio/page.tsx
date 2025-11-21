
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Wallet } from 'lucide-react';
import { PortfolioTable } from '@/components/portfolio/portfolio-table';
import { PortfolioOverview } from '@/components/portfolio/portfolio-overview';
import { useMemo, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DepositForm } from '@/components/wallet/deposit-form';
import { WithdrawalForm } from '@/components/wallet/withdrawal-form';
import { OrderHistory } from '@/components/trade/order-history';
import { DepositHistory } from '@/components/trade/deposit-history';
import { WithdrawalHistory } from '@/components/trade/withdrawal-history';
import type { Asset } from '@/lib/types';
import { useAssets } from '@/hooks/use-assets';
import { useBalances } from '@/hooks/use-balances';
import { useUser } from '@/providers/azure-auth-provider';
import { useMarketDataStore } from '@/state/market-data-store';


export default function WalletPage() {
  const { user } = useUser();
  const { data: balances, isLoading: balancesLoading, error: balancesError } = useBalances();
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();

  // Use the existing store to get ticker prices.
  // The service updates this store when active on a trade page.
  const ticker = useMarketDataStore((state) => state.ticker);

  const error = balancesError || assetsError;
  const isLoading = balancesLoading || assetsLoading;

  const prices = useMemo(() => {
    if (!ticker?.price || !ticker.s) return {};
    // Create a price map from the ticker data.
    // The portfolio can show live prices for the currently viewed market.
    const marketId = ticker.s.replace('USDT', '');
    return { [marketId]: { price: ticker.price } };
  }, [ticker]);


  const portfolioData = useMemo(() => {
    if (isLoading || !balances || !assets) {
      return [];
    }

    const assetsMap = new Map(assets.map(a => [a.id, a]));

    return balances.map(balance => {
      const asset = assetsMap.get(balance.assetId);
      // Use price from our map, fallback to 0. USDT is always 1.
      const price = asset?.symbol === 'USDT' ? 1 : (prices[asset?.symbol || '']?.price || 0);
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

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message || "Failed to load wallet data. Please try again later."}
          </AlertDescription>
        </Alert>
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
    <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          My Wallet
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          View your balances and manage your deposits and withdrawals.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          {renderContent()}
        </TabsContent>
        <TabsContent value="deposit" className="mt-6">
          <DepositForm assets={assets || []} />
        </TabsContent>
        <TabsContent value="withdraw" className="mt-6">
          <WithdrawalForm assets={assets || []} balances={balances || []} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <Tabs defaultValue="all-orders" className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent h-10 p-0 mb-4">
              <TabsTrigger
                value="all-orders"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10"
              >
                All Orders
              </TabsTrigger>
              <TabsTrigger
                value="buy-history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10"
              >
                Buy History
              </TabsTrigger>
              <TabsTrigger
                value="sell-history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10"
              >
                Sell History
              </TabsTrigger>
              <TabsTrigger
                value="deposits"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10"
              >
                Deposits
              </TabsTrigger>
              <TabsTrigger
                value="withdrawals"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10"
              >
                Withdrawals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all-orders">
              <OrderHistory userId={user?.uid || ''} />
            </TabsContent>
            <TabsContent value="buy-history">
              <OrderHistory userId={user?.uid || ''} side="BUY" />
            </TabsContent>
            <TabsContent value="sell-history">
              <OrderHistory userId={user?.uid || ''} side="SELL" />
            </TabsContent>
            <TabsContent value="deposits">
              <DepositHistory userId={user?.uid || ''} />
            </TabsContent>
            <TabsContent value="withdrawals">
              <WithdrawalHistory userId={user?.uid || ''} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
