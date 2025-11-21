// src/components/home/popular-coins.tsx
"use client";

import React from "react";
import MarketDataService from "@/services/market-data-service";
import useMarketDataStore from "@/state/market-data-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function PopularCoins({ list }: { list?: { id: string; label?: string }[] }) {
  const markets = list ?? [
    { id: "BTC-USDT", label: "BTC/USDT" },
    { id: "ETH-USDT", label: "ETH/USDT" },
    { id: "NOMOX-USDT", label: "NOMOX/USDT" },
  ];

  // show the ticker for the first market in store if exists
  const storeTicker = useMarketDataStore((s) => s.ticker[(s.symbol ?? "BTCUSDT")] ?? null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Popular
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {markets.map((m) => {
            const sym = m.id.replace("-", "").toUpperCase();
            return (
              <li key={m.id}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-medium hover:bg-accent"
                  onClick={() => {
                    MarketDataService.startFeed(sym, "1m");
                  }}
                >
                  {m.label ?? m.id}
                </Button>
              </li>
            );
          })}
        </ul>

        <div className="pt-3 border-t space-y-1">
          <div className="text-xs text-muted-foreground">Live Price</div>
          <div className="text-sm font-medium">{storeTicker?.lastPrice ?? "—"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
