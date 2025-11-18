
"use client";

import { useEffect, useState } from "react";
import MarketHeader from "../../../components/MarketHeader";
import TradingChart from "../../../components/TradingChart";
import OrderBook from "../../../components/OrderBook";
import TradesFeed from "../../../components/TradesFeed";
import BuySellForm from "../../../components/BuySellForm";
import { marketDataService } from "../../../lib/market-data-service";

export default function TradePageClient({ marketId }: { marketId: string }) {
  // Convert BTCUSDT → btcusdt for Binance websockets
  const symbol = marketId.toLowerCase();

  const [ticker, setTicker] = useState<any>(null);

  useEffect(() => {
    const streamName = `${symbol}@ticker`;
    const subscription = marketDataService.subscribe(streamName, (data: any) => {
      setTicker(data);
    });

    return () => {
      if (subscription) {
        subscription.close();
      }
    };
  }, [symbol]);

  return (
    <div className="h-screen p-3 grid grid-rows-[auto_1fr] gap-3 bg-[#0b0e11] text-white select-none">

      {/* MARKET HEADER */}
      <MarketHeader symbol={symbol} ticker={ticker} />

      {/* MAIN GRID */}
      <div className="grid grid-cols-[3fr_2fr_1.5fr] gap-3 min-h-0">

        {/* CHART + BUY/SELL FORM */}
        <div className="bg-[#111418] rounded-xl p-2 flex flex-col gap-3 overflow-hidden">
          <TradingChart symbol={symbol} />
          <BuySellForm symbol={symbol} />
        </div>

        {/* ORDERBOOK */}
        <div className="bg-[#111418] rounded-xl p-2 overflow-y-auto">
          <OrderBook symbol={symbol} />
        </div>

        {/* TRADES */}
        <div className="bg-[#111418] rounded-xl p-2 overflow-y-auto">
          <TradesFeed symbol={symbol} />
        </div>

      </div>
    </div>
  );
}
