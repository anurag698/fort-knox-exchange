'use client';

import ChartContainer from './ChartContainer';
import IntervalBar from './IntervalBar';
import { useState } from 'react';
import OrderBook from './trade/OrderBook';
import TradesFeed from './trade/TradesFeed';

interface Props {
  symbol: string;
  klineData: any[];
  depth: { bids: any[]; asks: any[] };
  trades: any[];
}

export default function ChartLayout({ symbol, klineData, depth, trades }: Props) {
  const [interval, setInterval] = useState('1m');

  return (
    <div className="grid grid-cols-12 gap-3 p-3 bg-[#0a0f14] text-gray-200 h-full">

      {/* Main chart */}
      <div className="col-span-9 flex flex-col gap-2">
        <IntervalBar interval={interval} onChange={setInterval} />
        <ChartContainer data={klineData} />
      </div>

      {/* Right panel — orderbook + trades */}
      <div className="col-span-3 flex flex-col gap-3">
        <OrderBook symbol={symbol} />
        <TradesFeed symbol={symbol} />
      </div>
    </div>
  );
}
