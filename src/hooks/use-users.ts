'use client';

import useSWR from 'swr';
import type { UserProfile } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUsers() {
  const { data, isLoading, error } = useSWR<UserProfile[]>(
    '/api/users',
    fetcher
  );

  return {
    data: data || [],
    isLoading,
    error
  };
}
