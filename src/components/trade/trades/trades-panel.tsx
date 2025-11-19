"use client";

import { useEffect } from "react";
import { useMarketDataStore } from "@/stores/market-data-store";
import { cn } from "@/lib/utils";

export default function TradesPanel({ pair }: { pair: string }) {
  const { trades, pushTrade } = useMarketDataStore();

  useEffect(() => {
    const symbol = pair.replace("-", "").toUpperCase();
    const ws = new WebSocket("wss://wbs.mexc.com/ws");

    const subscribeTrades = () => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          method: "SUBSCRIPTION",
          params: [`spot@public.deal.v3.api@${symbol}`],
          id: 3001,
        })
      );
    };

    ws.onopen = subscribeTrades;

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);

        if (msg.c?.includes("deal.v3.api") && Array.isArray(msg.d)) {
          msg.d.forEach((t: any) => {
            pushTrade({
              price: parseFloat(t.p),
              volume: parseFloat(t.v),
              side: t.S === "buy" ? "buy" : "sell",
              time: t.t,
            });
          });
        }
      } catch {}
    };

    ws.onclose = () => {};
    ws.onerror = () => {};

    return () => ws.close(1000);
  }, [pair, pushTrade]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour12: false });
  };

  return (
    <div className="flex flex-col h-full text-[var(--text-primary)]">

      {/* HEADER */}
      <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
        <span className="font-semibold text-sm">Recent Trades</span>
      </div>

      {/* TRADES LIST */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-[#1f2937]">
        {trades.slice(0, 100).map((t, idx) => (
          <div
            key={idx}
            className="flex justify-between text-xs py-0.5 items-center"
          >
            {/* PRICE */}
            <span
              className={cn(
                "font-medium",
                t.side === "buy" ? "text-[#1AC186]" : "text-[#F54E5D]"
              )}
            >
              {t.price.toFixed(6)}
            </span>

            {/* AMOUNT */}
            <span className="text-[var(--text-secondary)]">
              {t.volume.toFixed(4)}
            </span>

            {/* TIME */}
            <span className="text-[var(--text-secondary)]">
              {formatTime(t.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
