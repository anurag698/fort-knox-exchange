
'use client';

import { useState, useEffect } from 'react';
import { useAssets } from './use-assets';
import type { DexQuoteResponse } from '@/lib/dex/dex.types';
import { parseUnits, formatUnits } from 'ethers';

type Prices = {
  [symbol: string]: number;
};

// A map of known token symbols to their contract addresses on Ethereum (chain 1)
// In a real app, this would be more dynamic or comprehensive.
const tokenAddresses: { [symbol: string]: string } = {
    'BTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    'ETH': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH
    'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
    'SOL': '0xd31a59c85ae9d8edefe431d44004a40ab4d955b', // Wrapped SOL on ETH
    'XRP': '0x39fbbabf1638325219e566110de8fd052146113b', // Wrapped XRP on ETH
};

const tokenDecimals: { [symbol: string]: number } = {
    'BTC': 8,
    'ETH': 18,
    'USDT': 6,
    'SOL': 9,
    'XRP': 6,
};


export function usePrices() {
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  const [data, setData] = useState<Prices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (assetsLoading) {
      return;
    }
    if (assetsError) {
      setError(assetsError);
      setIsLoading(false);
      return;
    }
    if (!assets || assets.length === 0) {
      // If there are no assets, we can't fetch prices, but it's not an error state.
      // We can just set loading to false and data to an empty object.
      setIsLoading(false);
      setData({});
      return;
    }

    const fetchPrices = async () => {
      setIsLoading(true);
      setError(null);
      
      const newPrices: Prices = {};
      const chainId = 1; // Ethereum mainnet
      const toTokenAddress = tokenAddresses['USDT'];
      if (!toTokenAddress) {
          setError(new Error("USDT address not configured."));
          setIsLoading(false);
          return;
      }

      for (const asset of assets) {
        if (asset.symbol === 'USDT') {
          newPrices['USDT'] = 1.0;
          continue;
        }

        const fromTokenAddress = tokenAddresses[asset.symbol];
        if (!fromTokenAddress) {
            // If we don't have an address, we can't get a price. Skip it.
            console.warn(`No address configured for ${asset.symbol}`);
            continue;
        }

        try {
          const fromDecimals = tokenDecimals[asset.symbol] || 18;
          const amountInWei = parseUnits('1', fromDecimals).toString();
          
          const query = new URLSearchParams({
            chainId: chainId.toString(),
            fromTokenAddress: fromTokenAddress,
            toTokenAddress: toTokenAddress,
            amount: amountInWei,
          }).toString();

          const response = await fetch(`/api/dex/quote?${query}`);
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to fetch price for ${asset.symbol}:`, errorData.message);
            continue; // Skip this asset if pricing fails
          }

          const quote: DexQuoteResponse = await response.json();
          const price = parseFloat(formatUnits(quote.toTokenAmount, quote.toToken.decimals));
          newPrices[asset.symbol] = price;

        } catch (e)
        {
          console.error(`Error fetching price for ${asset.symbol}:`, e);
        }
      }
      
      // Ensure USDT is always priced at 1.0, even if assets list is empty
      if (!newPrices['USDT']) {
        newPrices['USDT'] = 1.0;
      }

      setData(newPrices);
      setIsLoading(false);
    };

    fetchPrices();
    // Set up an interval to refetch prices every 30 seconds
    const intervalId = setInterval(fetchPrices, 30000); 

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);

  }, [assets, assetsLoading, assetsError]);

  return { data, isLoading, error };
}
