"use client";

import { useEffect, useState } from "react";
import MarketDataService from "../lib/market-data-service";

export default function TradesFeed({ symbol }: { symbol: string }) {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    const service = MarketDataService.getInstance(symbol);

    service.subscribeTrades((trade: any) => {
      setTrades((prev) => {
        const updated = [trade, ...prev];
        return updated.slice(0, 40); // keep last 40 trades
      });
    });
  }, [symbol]);

  return (
    <div className="text-xs h-full overflow-hidden">
      <h2 className="text-gray-300 mb-2 text-sm font-semibold">Trades</h2>

      <div className="space-y-1 overflow-auto h-[calc(100%-30px)] pr-1">
        {trades.map((trade, i) => {
          const isSell = trade.m === true; // Binance marker
          return (
            <div
              key={i}
              className="flex justify-between p-1 rounded bg-gray-700/20"
            >
              <span className={isSell ? "text-red-400" : "text-green-400"}>
                {trade.p}
              </span>
              <span className="text-gray-300">{trade.q}</span>
              <span className="text-gray-500">
                {new Date(trade.T).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
