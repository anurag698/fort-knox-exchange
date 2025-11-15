
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import type { Market, Asset } from '@/lib/types';

interface MarketsData {
  markets: Market[];
  assets: Asset[];
}

interface UseMarketsDataResult {
  data: MarketsData | null;
  isLoading: boolean;
  error: Error | null;
}

export function useMarketsData(): UseMarketsDataResult {
  const firestore = useFirestore();
  const { user } = useUser();
  const [data, setData] = useState<MarketsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !user) {
      // Don't fetch until user and firestore are available
      setIsLoading(!user); // If user is loading, we are loading.
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const marketsQuery = query(collection(firestore, 'markets'), orderBy('id', 'asc'));
        const assetsQuery = query(collection(firestore, 'assets'), orderBy('name', 'asc'));

        const [marketsSnapshot, assetsSnapshot] = await Promise.all([
          getDocs(marketsQuery),
          getDocs(assetsQuery),
        ]);

        const marketsData = marketsSnapshot.docs.map(doc => ({
          ...doc.data() as Omit<Market, 'id'>,
          id: doc.id,
          // Add mock data for change and volume
          change: (doc.id.charCodeAt(0) % 11) - 5 + Math.random() * 2 - 1,
          volume: (doc.id.charCodeAt(1) % 100) * 100000 + Math.random() * 50000,
        }));
        
        const assetsData = assetsSnapshot.docs.map(doc => ({
          ...doc.data() as Omit<Asset, 'id'>,
          id: doc.id,
        }));

        setData({ markets: marketsData, assets: assetsData });
      } catch (err) {
        console.error("Failed to fetch markets and assets:", err);
        setError(err instanceof Error ? err : new Error("An unknown error occurred while fetching market data."));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firestore, user]);

  return { data, isLoading, error };
}
