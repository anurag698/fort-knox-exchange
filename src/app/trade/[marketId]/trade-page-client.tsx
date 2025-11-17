
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Balances } from '@/components/trade/balances';
import { MemoizedLightweightChart } from '@/components/trade/lightweight-chart';
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
import { X } from 'lucide-react';
import { AlertsManager } from '@/components/trade/alerts-manager';
import { usePriceAlerts } from '@/hooks/use-price-alerts';
import { useMarketDataStore } from '@/hooks/use-market-data-store';
import { marketDataService } from '@/lib/market-data-service';


export default function TradePageClient({ marketId }: { marketId: string }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(
    undefined
  );

  const [mobileTab, setMobileTab] = useState<MobileTab>('Orderbook');
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const isMobile = useIsMobile();
  
  const bids = useMarketDataStore(state => state.bids);
  const asks = useMarketDataStore(state => state.asks);
  const isConnected = useMarketDataStore(state => state.isConnected);
  const isLoading = !isConnected && bids.length === 0;

  useEffect(() => {
    marketDataService.setMarket(marketId);
  }, [marketId]);
  
  const midPrice = useMemo(() => {
    if (bids.length > 0 && asks.length > 0) {
      const bestBid = parseFloat(bids[0][0]);
      const bestAsk = parseFloat(asks[0][0]);
      return (bestBid + bestAsk) / 2;
    }
    return 0;
  }, [bids, asks]);

  // Hook for handling price alert logic
  usePriceAlerts(marketId, midPrice);


  const renderMobileContent = () => {
    return (
      <div className="relative overflow-x-hidden">
          <div className="swipe-slide flex transition-transform duration-300" style={{ transform: `translateX(-${['Orderbook', 'Trades', 'Depth', 'Positions', 'Alerts'].indexOf(mobileTab) * 100}%)` }}>
              <div className="w-full flex-shrink-0">
                  <OrderBook 
                      marketId={marketId} 
                      onPriceSelect={setSelectedPrice} 
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
              <div className="w-full flex-shrink-0">
                  <AlertsManager marketId={marketId} />
              </div>
          </div>
      </div>
    );
  }


  return (
    <>
      <div className="flex flex-col gap-4">
        <MarketHeader marketId={marketId} />

        {/* Desktop Layout */}
        <div className="hidden xl:grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-3 flex flex-col gap-4">
            <OrderBook 
              marketId={marketId} 
              onPriceSelect={setSelectedPrice} 
              height={360}
            />
            <DepthChart bids={bids} asks={asks} />
          </div>

          <div className="xl:col-span-6 flex flex-col gap-4">
            <MemoizedLightweightChart
              marketId={marketId}
              setIsChartFullscreen={setIsChartFullscreen} 
            />
            <div className="grid grid-cols-2 gap-4">
              <OrderForm marketId={marketId} selectedPrice={selectedPrice} />
              <AlertsManager marketId={marketId} />
            </div>
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
              <MemoizedLightweightChart
                marketId={marketId}
                setIsChartFullscreen={setIsChartFullscreen} 
              />
              <OrderForm marketId={marketId} selectedPrice={selectedPrice} />
              <Balances marketId={marketId} />
              <MobileTabs activeTab={mobileTab} setActiveTab={setMobileTab} />
              {renderMobileContent()}
          </div>
      </div>
      {isChartFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-background flex flex-col fullscreen-enter"
          onClick={() => setIsChartFullscreen(false)}
        >
          <div className="flex justify-end p-2">
            <button className="text-white p-2">
              <X className="h-6 w-6" />
              <span className="sr-only">Close fullscreen chart</span>
            </button>
          </div>
      
          <div className="flex-1 w-full h-full">
            <MemoizedLightweightChart
              marketId={marketId}
              setIsChartFullscreen={setIsChartFullscreen} 
            />
          </div>
        </div>
      )}
    </>
  );
}
