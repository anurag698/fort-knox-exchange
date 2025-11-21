'use client';

import useSWR from 'swr';
import { useUser } from '@/providers/azure-auth-provider';
import type { Balance } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useBalances() {
  const { user } = useUser();

  const { data, error, mutate } = useSWR(
    user ? `/api/balances?userId=${user.uid}` : null,
    fetcher,
    {
      refreshInterval: 2000, // Refresh every 2 seconds for faster updates
      revalidateOnFocus: true,
    }
  );

  // Aggregate duplicate balances by assetId
  const rawBalances: Balance[] = data?.status === 'success' ? data.balances : [];
  const balances: Balance[] = rawBalances.reduce((acc: Balance[], balance) => {
    const assetId = balance.assetId;
    if (!assetId) return acc;

    const existing = acc.find(b => b.assetId === assetId);
    if (existing) {
      // Aggregate with existing balance
      existing.available += balance.available;
      existing.locked += balance.locked;
    } else {
      // Add new balance entry
      acc.push({
        ...balance,
        assetId: assetId,
      });
    }
    return acc;
  }, []);

  return {
    data: balances,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
