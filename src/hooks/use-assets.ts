'use client';

import useSWR from 'swr';
import type { Asset } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAssets() {
  const { data, error, isLoading } = useSWR<Asset[]>(
    '/api/assets',
    fetcher
  );

  return {
    data: data || [],
    isLoading,
    error
  };
}
