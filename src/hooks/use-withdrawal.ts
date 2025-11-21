
'use client';

import useSWR from 'swr';
import type { Withdrawal } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Fetches a single withdrawal document by its ID from the Azure Cosmos DB.
 * @param withdrawalId The unique ID of the withdrawal to fetch.
 */
export function useWithdrawal(withdrawalId: string) {
  const { data, error, isLoading } = useSWR<Withdrawal>(
    withdrawalId ? `/api/withdrawals/${withdrawalId}` : null,
    fetcher
  );

  return { data, isLoading, error };
}
