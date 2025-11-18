'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type HistoryOrder = {
  id: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  type: string;
  status: string;          // FILLED | CANCELED | PARTIAL | EXPIRED
  price: number | null;
  avgPrice: number | null;
  quantity: number;
  filledAmount: number;
  fee: number | null;
  createdAt: { toDate: () => Date };
};

export function OrderHistoryPanel() {
  const [orders, setOrders] = useState<HistoryOrder[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/trade/history');
        if (!res.ok) {
            throw new Error(`Failed to fetch history: ${res.statusText}`);
        }
        const data = await res.json();
        setOrders(data);
      } catch (e) {
        console.error('Failed to load history', e);
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

  if (!orders || orders.length === 0)
    return (
      <div className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-center">
        No historical orders found.
      </div>
    );

  return (
    <div className="mt-4 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden h-full flex flex-col">
      <div className="flex items-center px-4 py-3 border-b border-zinc-800 text-white font-medium">
        Order History
      </div>

      <div className="flex-grow overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm text-zinc-500">
            <tr>
              <th className="py-2 px-4 text-left">Time</th>
              <th className="py-2 px-4 text-left">Market</th>
              <th className="py-2 px-4 text-left">Side</th>
              <th className="py-2 px-4 text-left">Type</th>
              <th className="py-2 px-4 text-right">Price</th>
              <th className="py-2 px-4 text-right">Avg Price</th>
              <th className="py-2 px-4 text-right">Filled</th>
              <th className="py-2 px-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-zinc-800 hover:bg-zinc-800/40 transition"
              >
                <td className="py-2 px-4 text-zinc-400 font-mono text-xs">
                  {new Date(o.createdAt.toDate()).toLocaleString()}
                </td>

                <td className="py-2 px-4 text-white font-semibold">{o.marketId}</td>

                <td
                  className={cn(
                    'py-2 px-4 font-semibold',
                    o.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {o.side}
                </td>

                <td className="py-2 px-4 text-zinc-300">{o.type}</td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {o.price ? o.price.toFixed(2) : '--'}
                </td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {o.price ? o.price.toFixed(2) : '--'}
                </td>

                <td className="py-2 px-4 text-right text-zinc-300 font-mono">
                  {o.filledAmount}/{o.quantity}
                </td>
                
                <td
                  className={cn(
                    'py-2 px-4 font-medium',
                    o.status === 'FILLED'
                      ? 'text-green-400'
                      : o.status === 'CANCELED'
                      ? 'text-yellow-400'
                      : 'text-zinc-400'
                  )}
                >
                  {o.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
