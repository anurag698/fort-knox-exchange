
'use client';

import useSWR from 'swr';
import type { UserProfile } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUsersCount() {
  const { data, error, isLoading } = useSWR<UserProfile[]>(
    '/api/users',
    fetcher
  );

  return {
    count: data ? data.length : null,
    isLoading,
    error
  };
}

