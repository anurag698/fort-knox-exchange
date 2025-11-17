
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
import MobileTabs from '@/components/trade/mobile-tabs';
import type { MobileTab } from '@/components/trade/mobile-tabs';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


export default function TradePageClient({ marketId }: { marketId: string }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(
    undefined
  );

  const [bids, setBids] = useState<RawOrder[]>([]);
  const [asks, setAsks] = useState<RawOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('Orderbook');
  const isMobile = useIsMobile();

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

  const renderMobileContent = () => {
    return (
      <div className="relative overflow-x-hidden">
          <div className="swipe-slide flex transition-transform duration-300" style={{ transform: `translateX(-${['Orderbook', 'Trades', 'Depth', 'Positions'].indexOf(mobileTab) * 100}%)` }}>
              <div className="w-full flex-shrink-0">
                  <OrderBook 
                      marketId={marketId} 
                      onPriceSelect={setSelectedPrice} 
                      bids={bids}
                      asks={asks}
                      isLoading={isLoading}
                      error={error}
                    />
              </div>
              <div className="w-full flex-shrink-0">
                  <RecentTrades marketId={marketId} />
              </div>
              <div className="w-full flex-shrink-0">
                  <DepthChart bids={bids} asks={asks} />
              </div>
               <div className="w-full flex-shrink-0">
                  <UserTrades marketId={marketId} />
              </div>
          </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-4">
      <MarketHeader marketId={marketId} />

      {/* Desktop Layout */}
      <div className="hidden xl:grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-3 flex flex-col gap-4">
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

        <div className="xl:col-span-6 flex flex-col gap-4">
          <MemoizedTradingViewChart marketId={marketId} />
          <OrderForm marketId={marketId} selectedPrice={selectedPrice} bids={bids} asks={asks} />
        </div>

        <div className="xl:col-span-3 flex flex-col gap-4">
          <Balances marketId={marketId} />
          <RecentTrades marketId={marketId} />
        </div>

        <div className="xl:col-span-12">
          <UserTrades marketId={marketId} />
        </div>
      </div>

       {/* Mobile Layout */}
        <div className="xl:hidden flex flex-col gap-4">
            <MemoizedTradingViewChart marketId={marketId} />
            <OrderForm marketId={marketId} selectedPrice={selectedPrice} bids={bids} asks={asks} />
            <Balances marketId={marketId} />
            <MobileTabs activeTab={mobileTab} setActiveTab={setMobileTab} />
            {renderMobileContent()}
        </div>
    </div>
  );
}
