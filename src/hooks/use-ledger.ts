'use client';

import useSWR from 'swr';
import { useUser } from '@/providers/azure-auth-provider';
import type { LedgerEntry } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useLedger() {
  const { user } = useUser();

  const { data, error, isLoading } = useSWR<LedgerEntry[]>(
    user ? `/api/ledger?userId=${user.uid}` : null,
    fetcher
  );

  return {
    data: data || [],
    isLoading,
    error
  };
}
