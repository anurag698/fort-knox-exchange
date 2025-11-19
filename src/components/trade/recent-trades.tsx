
"use client";

import { useMarketDataStore, Trade } from "@/state/market-data-store";
import { useMemo } from 'react';
import { useMarkets } from '@/hooks/use-markets';

export function RecentTrades({ marketId }: { marketId: string }) {
  const trades = useMarketDataStore((s) => s.trades);
  const symbol = useMarketDataStore((s) => s.symbol);
  const { data: markets } = useMarkets();
  const market = useMemo(() => markets?.find(m => m.id.replace('-','') === symbol), [markets, symbol]);
  const pricePrecision = market?.pricePrecision ?? 2;

  const Row = ({ trade }: { trade: Trade }) => {
    const isBuy = trade.S === 'buy';
    const priceColor = isBuy ? "text-chartgreen" : "text-chartred";
    const time = new Date(trade.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    return (
      <div className="grid grid-cols-3 gap-2 px-2 text-xs font-mono">
        <span className={priceColor}>{Number(trade.p).toFixed(pricePrecision)}</span>
        <span>{Number(trade.q).toFixed(4)}</span>
        <span className="text-muted-foreground">{time}</span>
      </div>
    );
  };

  return (
    <div className="bg-card border rounded-lg h-full flex flex-col">
      <div className="trading-panel-header px-3 py-2 border-b">
        <h2 className="text-sm font-medium">Recent Trades</h2>
      </div>
       <div className="trading-panel-body flex-grow overflow-y-auto space-y-1 py-1">
        {trades.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No trades yet
          </div>
        ) : (
          [...trades].reverse().map((trade, i) => <Row key={i} trade={trade} />)
        )}
      </div>
    </div>
  );
}
