"use client";

import { useState, useEffect } from 'react';
import { marketDataService } from '@/lib/market-data-service';
import { MarketHeader } from '@/components/trade/market-header';
import LightweightProChart from '@/components/trade/lightweight-pro-chart'; // Renamed for clarity
import { OrderBook } from '@/components/trade/order-book';
import { RecentTrades } from '@/components/trade/recent-trades';
import { OrderForm } from '@/components/trade/order-form';
import { Balances } from '@/components/trade/balances';
import { UserTrades } from '@/components/trade/user-trades';

export default function TradePageClient({ marketId }: { marketId: string }) {
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>();

  useEffect(() => {
    // Set the market for the centralized data service when the component mounts or marketId changes
    if (marketId) {
      marketDataService.setMarket(marketId);
    }
    // The service handles closing old connections and opening new ones.
  }, [marketId]);

  return (
    <div className="flex flex-col gap-4">
      <MarketHeader marketId={marketId} />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        
        {/* Left Column (Order Book and Recent Trades) */}
        <div className="hidden xl:flex xl:flex-col xl:col-span-1 gap-4">
          <OrderBook onPriceSelect={setSelectedPrice} marketId={marketId} />
          <RecentTrades marketId={marketId} />
        </div>

        {/* Center Column (Chart and User Trades) */}
        <div className="flex flex-col col-span-1 xl:col-span-3 gap-4">
           <LightweightProChart pair={marketId} />
           <div className="flex-grow">
             <UserTrades marketId={marketId} />
           </div>
        </div>

        {/* Right Column (Order Form and Balances) */}
        <div className="flex flex-col col-span-1 xl:col-span-1 gap-4">
            <OrderForm selectedPrice={selectedPrice} marketId={marketId} />
            <Balances marketId={marketId} />
        </div>
      </div>
    </div>
  );
}
