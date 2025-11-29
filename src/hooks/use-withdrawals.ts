
'use client';

import useSWR from 'swr';
import type { Withdrawal } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWithdrawals(status: Withdrawal['status'] = 'PENDING') {
  const { data, error, isLoading } = useSWR<Withdrawal[]>(
    `/api/withdrawals?status=${status}`,
    fetcher
  );

  return { data, isLoading, error };
}
