"use client";

import useMarketDataStore from "@/state/market-data-store";
import { useOrderStore } from "@/state/order-management-store";
import type { Trade } from "@/lib/market-types";
import { useMemo, useState, useEffect, useRef } from 'react';
import { useMarkets } from '@/hooks/use-markets';
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export function RecentTrades({ marketId }: { marketId: string }) {
  const symbol = useMarketDataStore((s) => (s as any).symbol) || marketId;
  const getTrades = useMarketDataStore((s) => s.getTrades);
  const localTrades = useOrderStore((s) => s.trades);
  const { data: markets } = useMarkets();
  const [flashingTrades, setFlashingTrades] = useState<Set<number>>(new Set());
  const prevTradesRef = useRef<Trade[]>([]);

  // Get trades for current symbol
  const marketTrades = useMemo(() => getTrades(symbol || 'BTCUSDT', 50), [getTrades, symbol]);

  // Merge local user trades with market trades
  const trades = useMemo(() => {
    // Filter local trades for this market
    const relevantLocalTrades = localTrades
      .filter(t => t.pair === marketId && t.status === 'completed')
      .map(t => ({
        id: t.id,
        p: t.price,
        q: t.quantity,
        ts: t.timestamp,
        side: t.side as "buy" | "sell",
        isUserTrade: true
      } as Trade & { isUserTrade?: boolean }));

    // Combine and sort by time desc
    return [...relevantLocalTrades, ...marketTrades]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 50);
  }, [marketTrades, localTrades, marketId]);

  const market = useMemo(() => markets?.find(m => m.id.replace('-', '') === symbol), [markets, symbol]);
  const pricePrecision = market?.pricePrecision ?? 2;
  const qtyPrecision = market?.quantityPrecision ?? 4;

  // Flash animation on new trades
  useEffect(() => {
    if (trades && prevTradesRef.current.length > 0) {
      const newTrades = trades.filter(t => !prevTradesRef.current.some(pt => pt.ts === t.ts));
      if (newTrades.length > 0) {
        const newFlashes = new Set(newTrades.map(t => t.ts));
        setFlashingTrades(newFlashes);
        setTimeout(() => setFlashingTrades(new Set()), 400);
      }
    }
    prevTradesRef.current = trades || [];
  }, [trades]);

  const Row = ({ trade }: { trade: Trade & { isUserTrade?: boolean } }) => {
    const isBuy = trade.side === 'buy';
    const priceColor = isBuy ? "text-green-500" : "text-red-500";
    const time = new Date(trade.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const isFlashing = flashingTrades.has(trade.ts);

    return (
      <div className={cn(
        "grid grid-cols-3 gap-2 px-3 py-1 text-[11px] font-mono hover:bg-primary/5 cursor-pointer transition-all group relative",
        isFlashing && (isBuy ? "flash-green" : "flash-red"),
        trade.isUserTrade && "bg-primary/10 border-l-2 border-primary"
      )}>
        <span className={cn(priceColor, "font-medium group-hover:font-bold transition-all flex items-center gap-1")}>
          {Number(trade.p).toFixed(pricePrecision)}
          {trade.isUserTrade && <User className="h-3 w-3 text-primary opacity-70" />}
        </span>
        <span className="text-right text-foreground/80 group-hover:text-foreground">{Number(trade.q).toFixed(qtyPrecision)}</span>
        <span className="text-right text-muted-foreground group-hover:text-foreground">{time}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col glass overflow-hidden animate-slide-in-up rounded-lg">
      {/* Header with Glassmorphism */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border-b border-primary/20">
        <h2 className="text-xs font-semibold flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          Recent Trades
        </h2>
      </div>

      {/* HEADERS */}
      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-muted/10">
        <span>Price(USDT)</span>
        <span className="text-right">Amount({symbol?.replace('USDT', '') || 'BTC'})</span>
        <span className="text-right">Time</span>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-thin">
        {!trades || trades.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No recent trades
          </div>
        ) : (
          trades.map((trade, i) => <Row key={`${trade.ts}-${i}`} trade={trade} />)
        )}
      </div>
    </div>
  );
}
