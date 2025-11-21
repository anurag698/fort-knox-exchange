'use client';

import useSWR from 'swr';
import { useUser } from '@/providers/azure-auth-provider';
import type { Order } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json().then(data => data.orders));

export function useOrders(userId?: string, marketId?: string) {
  const { user, isUserLoading } = useUser();
  const targetUserId = userId || user?.uid;

  const queryParams = new URLSearchParams();
  if (targetUserId) queryParams.append('userId', targetUserId);
  if (marketId) queryParams.append('symbol', marketId);

  const { data, error, isLoading } = useSWR<Order[]>(
    targetUserId ? `/api/orders?${queryParams.toString()}` : null,
    fetcher
  );

  return {
    data: data || [],
    isLoading: isUserLoading || isLoading,
    error
  };
}
