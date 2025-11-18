'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { SpotPosition } from '@/lib/types';


export function PositionsPanel() {
  const [positions, setPositions] = useState<SpotPosition[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/trade/positions');
        if (!res.ok) {
            throw new Error('Failed to fetch positions');
        }
        const data = await res.json();
        setPositions(data);
      } catch (e) {
        console.error('Failed to load positions', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading)
    return (
      <div className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
        <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );

  if (!positions || positions.length === 0)
    return (
      <div className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-center h-full flex items-center justify-center">
        You have no spot positions.
      </div>
    );

  return (
    <div className="mt-4 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden h-full flex flex-col">
      <div className="flex items-center px-4 py-3 border-b border-zinc-800 text-white font-medium">
        Spot Positions
      </div>

      <div className="flex-grow overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm text-zinc-500">
            <tr>
              <th className="py-2 px-4 text-left">Asset</th>
              <th className="py-2 px-4 text-right">Quantity</th>
              <th className="py-2 px-4 text-right">Avg Price</th>
              <th className="py-2 px-4 text-right">Market Price</th>
              <th className="py-2 px-4 text-right">Value</th>
              <th className="py-2 px-4 text-right">PnL</th>
            </tr>
          </thead>

          <tbody>
            {positions.map((p) => (
              <tr
                key={p.assetId}
                className="border-b border-zinc-800 hover:bg-zinc-800/40 transition"
              >
                <td className="py-2 px-4 text-white font-semibold">{p.assetId}</td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {p.quantity.toFixed(4)}
                </td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {p.avgPrice ? p.avgPrice.toFixed(2) : '--'}
                </td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {p.marketPrice ? p.marketPrice.toFixed(2) : '--'}
                </td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {p.value ? p.value.toFixed(2) : '--'}
                </td>

                <td
                  className={cn(
                    'py-2 px-4 text-right font-semibold font-mono',
                    p.pnl !== null && p.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {p.pnl !== null && p.pnlPercent !== null
                    ? `${p.pnl.toFixed(2)} (${p.pnlPercent?.toFixed(2)}%)`
                    : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
