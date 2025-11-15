
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState, useEffect } from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirestore, useUser } from '@/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import type { Market, Asset, Balance } from '@/lib/types';

export function Balances({ marketId }: { marketId: string }) {
  const firestore = useFirestore();
  const { user } = useUser();

  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);


  useEffect(() => {
    if (!firestore || !user) {
      setIsLoading(false);
      return;
    }
    
    const unsubBalances = onSnapshot(collection(firestore, 'users', user.uid, 'balances'), (snapshot) => {
        setBalances(snapshot.docs.map(doc => ({...doc.data() as Balance, id: doc.id})));
    }, setError);

    const unsubAssets = onSnapshot(collection(firestore, 'assets'), (snapshot) => {
        setAssets(snapshot.docs.map(doc => ({...doc.data() as Asset, id: doc.id})));
    }, setError);

    const unsubMarket = onSnapshot(doc(firestore, 'markets', marketId), (doc) => {
        if (doc.exists()) {
            setMarket({ ...doc.data() as Market, id: doc.id });
        } else {
            setMarket(null);
        }
    }, setError);

    if(balances && assets && market) {
        setIsLoading(false);
    }

    return () => {
        unsubBalances();
        unsubAssets();
        unsubMarket();
    };

  }, [firestore, user, marketId, balances, assets, market]);


  const { baseAsset, quoteAsset, baseBalance, quoteBalance } = useMemo(() => {
    if (!market || !assets || !balances) {
      return { baseAsset: null, quoteAsset: null, baseBalance: null, quoteBalance: null };
    }

    const baseAsset = assets.find(a => a.id === market.baseAssetId);
    const quoteAsset = assets.find(a => a.id === market.quoteAssetId);

    const baseBalance = balances.find(b => b.assetId === market.baseAssetId);
    const quoteBalance = balances.find(b => b.assetId === market.quoteAssetId);

    return { baseAsset, quoteAsset, baseBalance, quoteBalance };
  }, [market, assets, balances]);


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
