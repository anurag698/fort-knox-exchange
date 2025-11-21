'use client';

import useSWR from 'swr';
import { useUser } from '@/providers/azure-auth-provider'; // Keeping useUser for auth state if needed, or replace if moving away from firebase auth entirely. 
// Assuming useUser provides the current userId.
import type { Withdrawal } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserWithdrawals(userId?: string) {
  const { user: authUser } = useUser();
  const targetUserId = userId || authUser?.uid;

  const { data, error, isLoading } = useSWR<Withdrawal[]>(
    targetUserId ? `/api/withdrawals?userId=${targetUserId}` : null,
    fetcher
  );

  return {
    data: data || [],
    isLoading,
    error
  };
}
