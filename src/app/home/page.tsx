
'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PopularCoins } from '@/components/home/popular-coins';
import { NewsFeed } from '@/components/home/news-feed';
import { DownloadApp } from '@/components/home/download-app';
import { Faq } from '@/components/home/faq';
import { BookOpen } from 'lucide-react';
import { useUser } from '@/firebase';
import { useMemo } from 'react';
import { useBalances } from '@/hooks/use-balances';
import { useUserById } from '@/hooks/use-user-by-id';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarkets } from '@/hooks/use-markets';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useState, useEffect } from 'react';
import type { MarketData } from '@/lib/types';


export default function Home() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { data: userProfile, isLoading: isProfileLoading } = useUserById(user?.uid);
  const { data: balances, isLoading: areBalancesLoading } = useBalances();
  const { data: markets, isLoading: marketsLoading } = useMarkets();
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [marketDataLoading, setMarketDataLoading] = useState(true);

  const isLoading = isProfileLoading || areBalancesLoading || marketsLoading || marketDataLoading;

   useEffect(() => {
    if (!firestore) {
      setMarketDataLoading(false);
      return;
    };

    setMarketDataLoading(true);
    const marketDataQuery = query(collection(firestore, 'market_data'));

    const unsubMarketData = onSnapshot(marketDataQuery, (snapshot) => {
        const liveData: Record<string, MarketData> = {};
        snapshot.forEach(doc => {
            liveData[doc.id] = { ...doc.data() as MarketData, id: doc.id };
        });
        setMarketData(liveData);
        setMarketDataLoading(false);
    }, (err) => {
        console.error("Home page market data subscription error:", err);
        setMarketDataLoading(false);
    });

    return () => unsubMarketData();
  }, [firestore]);


  const { totalBalanceInUsdt, totalBalanceInBtc } = useMemo(() => {
    if (!balances || balances.length === 0 || !markets || Object.keys(marketData).length === 0) {
      return { totalBalanceInUsdt: 0, totalBalanceInBtc: 0 };
    }
  
    const btcPrice = marketData['BTC-USDT']?.price || 0;
  
    const totalUsdt = balances.reduce((acc, balance) => {
      if (balance.assetId === 'USDT') {
        return acc + balance.available;
      }
      const market = markets.find(m => m.baseAssetId === balance.assetId && m.quoteAssetId === 'USDT');
      if (market && marketData[market.id]) {
        return acc + (balance.available * marketData[market.id].price);
      }
      return acc;
    }, 0);
  
    const totalBtc = btcPrice > 0 ? totalUsdt / btcPrice : 0;
  
    return { totalBalanceInUsdt: totalUsdt, totalBalanceInBtc: totalBtc };
  }, [balances, markets, marketData]);

  return (
    <div className="flex flex-col gap-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col justify-center gap-8">
            <div className="flex flex-col gap-4">
              {isLoading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-16 w-3/4" />
                    <Skeleton className="h-16 w-1/2" />
                 </div>
              ) : userProfile ? (
                 <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                  Welcome Back,
                  <br />
                  {userProfile.username}
                </h1>
              ) : (
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                  Get Verified and
                  <br />
                  Start Your Crypto
                  <br />
                  Journey
                </h1>
              )}
              <div className="mt-6">
                <p className="text-sm text-muted-foreground">Your Estimated Balance</p>
                {isLoading ? <Skeleton className="h-10 w-48 mt-1" /> : (
                  <>
                    <p className="text-3xl font-bold">{totalBalanceInBtc.toFixed(4)} BTC <span className="text-xl text-muted-foreground">≈ ${totalBalanceInUsdt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></p>
                    <p className="text-sm text-muted-foreground mt-1">Today's PnL $0.00 (0.00%)</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button size="lg" asChild>
                <Link href={userProfile?.kycStatus === 'VERIFIED' ? "/trade/BTC-USDT" : "/settings"}>
                  {userProfile?.kycStatus === 'VERIFIED' ? 'Start Trading' : 'Verify Now'}
                </Link>
              </Button>
              <Button size="lg" variant="ghost">
                <BookOpen className="mr-2 h-4 w-4" />
                Read Tutorial
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-8">
            <PopularCoins />
            <NewsFeed />
          </div>
      </div>
      <DownloadApp />
      <Faq />
    </div>
  );
}
