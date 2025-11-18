'use client';

import ChartContainer from './ChartContainer';
import OrderBook from './trade/OrderBook';
import TradesFeed from './trade/TradesFeed';
import BuySellForm from './trade/BuySellForm';
import IntervalBar from './IntervalBar';
import { useState } from 'react';

interface Props {
  symbol: string;
  klineData: any[];
  depth: { bids: any[]; asks: any[] };
  trades: any[];
}

export default function AdvancedLayout({ symbol, klineData, depth, trades }: Props) {
  const [interval, setInterval] = useState('1m');

  return (
    <div className="grid grid-cols-12 gap-3 p-3 bg-[#0a0f14] text-gray-200 h-full">

      {/* Left side — Chart + intervals */}
      <div className="col-span-8 flex flex-col gap-2">
        <IntervalBar interval={interval} onChange={setInterval} />
        <ChartContainer data={klineData} />
      </div>

      {/* Middle — Orderbook */}
      <div className="col-span-2">
        <OrderBook symbol={symbol} />
      </div>

      {/* Right — Trades */}
      <div className="col-span-2">
        <TradesFeed symbol={symbol} />
      </div>

      {/* Bottom — Buy/Sell */}
      <div className="col-span-12">
        <BuySellForm symbol={symbol} />
      </div>
    </div>
  );
}
