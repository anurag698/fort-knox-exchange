'use client';

import { useBalances } from '@/hooks/use-balances';
import { useAssets } from '@/hooks/use-assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState, useEffect } from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Market } from '@/lib/types';

export function Balances({ marketId }: { marketId: string }) {
  const { data: balances, isLoading: balancesLoading, error: balancesError } = useBalances();
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  
  const firestore = useFirestore();
  const [market, setMarket] = useState<Market | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState<Error | null>(null);

  const marketDocRef = useMemoFirebase(
    () => (firestore && marketId ? doc(firestore, 'markets', marketId) : null),
    [firestore, marketId]
  );

  useEffect(() => {
    if (!marketDocRef) {
        setMarketLoading(false);
        return;
    };

    setMarketLoading(true);
    getDoc(marketDocRef)
      .then(docSnap => {
        if (docSnap.exists()) {
          setMarket({ ...docSnap.data() as Omit<Market, 'id'>, id: docSnap.id });
        } else {
          setMarket(null);
        }
        setMarketError(null);
      })
      .catch(err => {
        console.error("Error fetching market:", err);
        setMarketError(err);
      })
      .finally(() => {
        setMarketLoading(false);
      });
  }, [marketDocRef]);


  const isLoading = balancesLoading || assetsLoading || marketLoading;
  const error = balancesError || assetsError || marketError;

  const { baseAsset, quoteAsset, baseBalance, quoteBalance } = useMemo(() => {
    if (isLoading || !market || !assets || !balances) {
      return { baseAsset: null, quoteAsset: null, baseBalance: null, quoteBalance: null };
    }

    const baseAsset = assets.find(a => a.id === market.baseAssetId);
    const quoteAsset = assets.find(a => a.id === market.quoteAssetId);

    const baseBalance = balances.find(b => b.assetId === market.baseAssetId);
    const quoteBalance = balances.find(b => b.assetId === market.quoteAssetId);

    return { baseAsset, quoteAsset, baseBalance, quoteBalance };
  }, [isLoading, market, assets, balances]);


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
