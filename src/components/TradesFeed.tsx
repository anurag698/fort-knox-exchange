"use client";

import { useEffect, useState } from "react";
import MarketDataService from "../lib/market-data-service";

export default function TradesFeed({ symbol }: any) {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    const ws = MarketDataService.getInstance(symbol);

    ws.subscribeTrades((t: any) => {
      setTrades(prev => [t, ...prev].slice(0, 30));
    });
  }, [symbol]);

  return (
    <div className="text-xs">
      <h2 className="text-gray-300 mb-2">Trades</h2>

      {trades.map((t, i) => (
        <div key={i} className="flex justify-between p-1 rounded-lg bg-gray-700/20">
          <span className={t.m ? "text-red-400" : "text-green-400"}>{t.p}</span>
          <span className="text-gray-300">{t.q}</span>
          <span className="text-gray-500">{new Date(t.T).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}
