'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PopularCoins } from '@/components/home/popular-coins';
import { NewsFeed } from '@/components/home/news-feed';
import { DownloadApp } from '@/components/home/download-app';
import { Faq } from '@/components/home/faq';
import { BookOpen } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useBalances } from '@/hooks/use-balances';
import { useMemo } from 'react';

export default function Home() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { data: balances } = useBalances();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const estimatedBalance = useMemo(() => {
    // A real implementation would fetch live prices and calculate total value
    if (!balances || balances.length === 0) return 0;
    const btcBalance = balances.find(b => b.assetId === 'BTC');
    return btcBalance?.available ?? 0;
  }, [balances]);

  return (
    <div className="flex flex-col gap-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col justify-center gap-8">
            <div className="flex flex-col gap-4">
              {userProfile ? (
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
                <p className="text-3xl font-bold">{estimatedBalance.toFixed(2)} BTC <span className="text-xl text-muted-foreground">≈ $0.00</span></p>
                <p className="text-sm text-muted-foreground mt-1">Today's PnL $0.00 (0.00%)</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button size="lg" asChild>
                <Link href={userProfile?.kycStatus === 'VERIFIED' ? "/trade" : "/settings"}>
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
