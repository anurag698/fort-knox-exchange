'use client';

import useSWR from 'swr';
import { useUser } from '@/providers/azure-auth-provider';
import type { Deposit } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserDeposits(userId?: string) {
  const { user: authUser } = useUser();
  const targetUserId = userId || authUser?.uid;

  const { data, error, isLoading } = useSWR<Deposit[]>(
    targetUserId ? `/api/deposits?userId=${targetUserId}` : null,
    fetcher
  );

  return {
    data: data || [],
    isLoading,
    error
  };
}
