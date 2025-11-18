'use client';

import DepthChart from './DepthChart';
import AggregationSelector from './AggregationSelector';
import OrderBook from './trade/OrderBook';
import TradesFeed from './trade/TradesFeed';
import { useState } from 'react';

interface Props {
  depth: { bids: any[]; asks: any[] };
  trades: any[];
}

export default function DepthLayout({ depth, trades }: Props) {
  const [agg, setAgg] = useState(0.1);

  // Apply aggregation (rounding)
  const aggregate = (list: any[]) => {
    return list
      .map(([price, volume]: any) => ({
        price: Math.round(parseFloat(price) / agg) * agg,
        volume: parseFloat(volume),
      }))
      .slice(0, 50);
  };

  const bidsAgg = aggregate(depth.bids);
  const asksAgg = aggregate(depth.asks);

  return (
    <div className="grid grid-cols-12 gap-3 p-3 bg-[#0a0f14] text-gray-200 h-full">

      {/* Left: Depth Chart */}
      <div className="col-span-9 flex flex-col gap-2">
        <AggregationSelector value={agg} onChange={setAgg} />
        <DepthChart bids={bidsAgg} asks={asksAgg} />
      </div>

      {/* Right: Orderbook + Trades */}
      <div className="col-span-3 flex flex-col gap-3">
        <OrderBook symbol="" />
        <TradesFeed symbol="" />
      </div>
    </div>
  );
}
