'use client';

import { useState, useEffect } from 'react';
import { Balances } from '@/components/trade/balances';
import { MemoizedTradingViewChart } from '@/components/trade/trading-view-chart';
import { OrderBook } from '@/components/trade/order-book';
import { OrderForm } from '@/components/trade/order-form';
import { UserTrades } from '@/components/trade/user-trades';
import { RecentTrades } from '@/components/trade/recent-trades';
import { MarketHeader } from '@/components/trade/market-header';
import { DepthChart } from '@/components/trade/depth-chart';
import type { RawOrder } from '@/lib/types';


export default function TradePageClient({ marketId }: { marketId: string }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(
    undefined
  );

  const [bids, setBids] = useState<RawOrder[]>([]);
  const [asks, setAsks] = useState<RawOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!marketId) {
      setIsLoading(false);
      setError(new Error("Market ID is not specified."));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setBids([]);
    setAsks([]);

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${marketId.replace('-', '').toLowerCase()}@depth20@100ms`);

    ws.onopen = () => setIsLoading(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.bids && data.asks) {
        setBids(data.bids);
        setAsks(data.asks);
      }
    };
    ws.onerror = (event) => {
      setError(new Error('Failed to connect to the order book feed.'));
      setIsLoading(false);
    };

    return () => ws.close();
  }, [marketId]);


  return (
    <div className="flex flex-col gap-4">
      <MarketHeader marketId={marketId} />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-3 flex flex-col gap-4 order-2 xl:order-1">
          <OrderBook 
            marketId={marketId} 
            onPriceSelect={setSelectedPrice} 
            bids={bids}
            asks={asks}
            isLoading={isLoading}
            error={error}
          />
          <DepthChart bids={bids} asks={asks} />
        </div>

        <div className="xl:col-span-6 flex flex-col gap-4 order-1 xl:order-2">
          <MemoizedTradingViewChart marketId={marketId} />
          <OrderForm marketId={marketId} selectedPrice={selectedPrice} />
        </div>

        <div className="xl:col-span-3 flex flex-col gap-4 order-3 xl:order-3">
          <Balances marketId={marketId} />
          <RecentTrades marketId={marketId} />
        </div>

        <div className="xl:col-span-12 order-4">
          <UserTrades marketId={marketId} />
        </div>
      </div>
    </div>
  );
}
