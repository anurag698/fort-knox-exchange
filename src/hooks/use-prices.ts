
'use client';

// This is a mock hook to simulate fetching live price data.
// In a real application, this would fetch data from a crypto price API.
import { useState, useEffect } from 'react';

type Prices = {
  [symbol: string]: number;
};

const mockPrices: Prices = {
  BTC: 68543.21,
  ETH: 3567.89,
  USDT: 1.00,
  SOL: 150.45,
  XRP: 0.52,
};

export function usePrices() {
  const [data, setData] = useState<Prices | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate network delay
    const timer = setTimeout(() => {
      setData(mockPrices);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading, error: null };
}
