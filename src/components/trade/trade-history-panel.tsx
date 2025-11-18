'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type TradeFill = {
  id: string;
  orderId: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  fee: number | null;
  createdAt: { toDate: () => Date };
};

export function TradeHistoryPanel() {
  const [fills, setFills] = useState<TradeFill[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/trade/fills');
        if (!res.ok) {
            throw new Error('Failed to fetch trade history');
        }
        const data = await res.json();
        setFills(data);
      } catch (e) {
        console.error('Failed to load trade history', e);
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
            <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );

  if (!fills || fills.length === 0)
    return (
      <div className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-center">
        No trades executed yet.
      </div>
    );

  return (
    <div className="mt-4 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden h-full flex flex-col">
      <div className="flex items-center px-4 py-3 border-b border-zinc-800 text-white font-medium">
        Trade History
      </div>

      <div className="flex-grow overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm text-zinc-500">
            <tr>
              <th className="py-2 px-4 text-left">Time</th>
              <th className="py-2 px-4 text-left">Market</th>
              <th className="py-2 px-4 text-left">Side</th>
              <th className="py-2 px-4 text-right">Price</th>
              <th className="py-2 px-4 text-right">Qty</th>
              <th className="py-2 px-4 text-right">Fee</th>
            </tr>
          </thead>

          <tbody>
            {fills.map((t) => (
              <tr
                key={t.id}
                className="border-b border-zinc-800 hover:bg-zinc-800/40 transition"
              >
                <td className="py-2 px-4 text-zinc-400 font-mono text-xs">
                  {new Date(t.createdAt.toDate()).toLocaleString()}
                </td>

                <td className="py-2 px-4 text-white">{t.marketId}</td>

                <td
                  className={cn(
                    'py-2 px-4 font-semibold',
                    t.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {t.side}
                </td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {t.price.toFixed(2)}
                </td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {t.quantity}
                </td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {t.fee ? t.fee.toFixed(4) : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
