"use client";

import { marketDataService } from "../lib/market-data-service";
import { useEffect, useState } from "react";

export default function OrderBook({ symbol }: any) {
  const [bids, setBids] = useState<any[]>([]);
  const [asks, setAsks] = useState<any[]>([]);

  useEffect(() => {
    const streamName = `${symbol}@depth20@100ms`;
    const subscription = marketDataService.subscribe(streamName, (data: any) => {
        if (data.b && data.a) {
            setBids(data.b.slice(0, 15));
            setAsks(data.a.slice(0, 15));
        }
    });

    return () => {
        if (subscription) {
            subscription.close();
        }
    }
  }, [symbol]);

  return (
    <div className="text-xs">
      <h2 className="text-gray-300 mb-2">Order Book</h2>

      <div className="grid grid-cols-3 gap-1 text-gray-400 mb-1">
        <span>Price</span>
        <span>Amount</span>
        <span>Total</span>
      </div>

      {/* ASKS */}
      {asks.map((a, i) => (
        <div key={`ask-${i}`} className="grid grid-cols-3 gap-1 text-red-400 bg-red-500/10 rounded px-1">
          <span>{a[0]}</span>
          <span>{a[1]}</span>
          <span>{(parseFloat(a[0]) * parseFloat(a[1])).toFixed(2)}</span>
        </div>
      ))}

      {/* BIDS */}
      {bids.map((b, i) => (
        <div key={`bid-${i}`} className="grid grid-cols-3 gap-1 text-green-400 bg-green-500/10 rounded px-1">
          <span>{b[0]}</span>
          <span>{b[1]}</span>
          <span>{(parseFloat(b[0]) * parseFloat(b[1])).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
