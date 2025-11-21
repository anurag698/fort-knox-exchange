'use client';

import useSWR from 'swr';
import type { UserProfile } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserById(userId?: string) {
  const { data, error, isLoading } = useSWR<UserProfile>(
    userId ? `/api/user?userId=${userId}` : null,
    fetcher
  );

  return {
    data,
    isLoading,
    error
  };
}
