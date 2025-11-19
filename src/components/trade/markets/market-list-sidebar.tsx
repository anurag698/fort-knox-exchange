"use client";

import { useState, useMemo, useEffect } from "react";
import MarketListItem from "./market-list-item";
import { useMarkets } from "@/hooks/use-markets";
import { cn } from "@/lib/utils";
import { marketDataService } from '@/lib/market-data-service';

export function MarketListSidebar() {
  const { data: markets, isLoading } = useMarkets();
  const [search, setSearch] = useState("");
  const [activeMarketId, setActiveMarketId] = useState('BTC-USDT');

  useEffect(() => {
    if (!markets) return;
    
    // Subscribe to all market tickers for the sidebar
    const symbols = markets.map(m => m.id.replace('-', '').toLowerCase() + '@bookTicker');
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols.join('/')}`);

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.s) {
            marketDataService.get(message.s.toLowerCase()).setTickerData(message);
        }
    };
    
    ws.onerror = (error) => {
        console.error("Sidebar WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [markets]);

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    return markets.filter((m) =>
      m.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [markets, search]);
  
  if (isLoading) {
      return (
          <div className="h-full flex flex-col bg-[#0D111A] border-r border-[#131D2E]">
            <div className="p-3"><div className="w-full h-8 rounded-md bg-[#131D2E] animate-pulse" /></div>
            <div className="flex-1 px-2 space-y-1 overflow-y-auto">
                {[...Array(15)].map((_, i) => <div key={i} className="w-full h-12 rounded-md bg-[#131D2E] animate-pulse" />)}
            </div>
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col bg-[#0D111A] border-r border-[#131D2E]">
      <div className="p-3">
        <input
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 text-sm rounded-md bg-[#131D2E] text-white placeholder-[#6B7280] outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4 scrollbar-thin scrollbar-thumb-[#1A2332]">
        {filteredMarkets.map((m) => (
          <MarketListItem 
            key={m.id} 
            market={m} 
            active={m.id === activeMarketId} 
            onClick={() => setActiveMarketId(m.id)}
          />
        ))}
      </div>
    </div>
  );
}
