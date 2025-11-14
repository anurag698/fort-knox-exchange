
'use client';

import { useBalances } from '@/hooks/use-balances';
import { useAssets } from '@/hooks/use-assets';
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
import { UserDeposits } from '@/components/wallet/user-deposits';
import { UserWithdrawals } from '@/components/wallet/user-withdrawals';


export default function WalletPage() {
  const { data: balances, isLoading: balancesLoading, error: balancesError } = useBalances();
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(true);

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade/adausdt@trade/maticusdt@trade/dogeusdt@trade');
    
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

    ws.onclose = () => {
      console.log('Price stream closed.');
    }

    ws.onerror = (error) => {
        console.error('Price stream error:', error);
        setPricesLoading(false);
    }

    return () => {
      ws.close();
    };
  }, []);

  const isLoading = balancesLoading || assetsLoading || pricesLoading;
  const error = balancesError || assetsError;

  const portfolioData = useMemo(() => {
    if (isLoading || !balances || !assets || Object.keys(prices).length === 0) {
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
    
    if (error) {
       return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load wallet data. Please try again later.
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
    <div className="flex flex-col gap-8">
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
          <div className="grid gap-8">
            <UserDeposits />
            <UserWithdrawals />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
