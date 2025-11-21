'use client';

import useSWR from 'swr';
import type { Market } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMarkets() {
  const { data, error, isLoading } = useSWR<Market[]>(
    '/api/markets',
    fetcher
  );

  return {
    data: data || [],
    isLoading,
    error
  };
}
