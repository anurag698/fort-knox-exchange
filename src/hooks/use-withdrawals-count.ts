
'use client';

import useSWR from 'swr';
import type { Withdrawal } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWithdrawalsCount(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' = 'PENDING') {
  const { data, error, isLoading } = useSWR<Withdrawal[]>(
    `/api/withdrawals?status=${status}`,
    fetcher
  );

  return {
    count: data ? data.length : null,
    isLoading,
    error
  };
}

