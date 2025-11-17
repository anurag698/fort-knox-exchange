"use client";

import MarketHeader from "@/components/MarketHeader";
import TradingChart from "@/components/TradingChart";
import OrderBook from "@/components/OrderBook";
import TradesFeed from "@/components/TradesFeed";
import BuySellForm from "@/components/BuySellForm";
import MarketDataService from "../../../lib/market-data-service";
import { useEffect, useState } from "react";

export default function TradePageClient({ marketId }: { marketId: string }) {
  const symbol = marketId.toLowerCase(); // BTC-USDT → btcusdt
  const [ticker, setTicker] = useState<any>(null);

  useEffect(() => {
    const service = MarketDataService.getInstance(symbol);

    const unsub = service.subscribeTicker((data: any) => {
      setTicker(data);
    });

    return () => unsub();
  }, [symbol]);

  return (
    <div className="h-screen p-3 grid grid-rows-[auto_1fr] gap-3 bg-[#0b0e11] text-white select-none">

      {/* MARKET HEADER */}
      <MarketHeader symbol={symbol} ticker={ticker} />

      {/* MAIN GRID */}
      <div className="grid grid-cols-[3fr_2fr_1.5fr] gap-3 min-h-0">

        {/* CHART */}
        <div className="bg-[#111418] rounded-xl p-2">
          <TradingChart symbol={symbol} />
          <div className="mt-3">
            <BuySellForm symbol={symbol} />
          </div>
        </div>

        {/* ORDERBOOK */}
        <div className="bg-[#111418] rounded-xl p-2">
          <OrderBook symbol={symbol} />
        </div>

        {/* TRADES FEED */}
        <div className="bg-[#111418] rounded-xl p-2">
          <TradesFeed symbol={symbol} />
        </div>

      </div>
    </div>
  );
}
