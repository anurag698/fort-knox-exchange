"use client";

import { useEffect, useState, useMemo } from "react";
import { Star } from "lucide-react";
import Link from "next/link";

type Market = {
  symbol: string;
  price: number;
  change: number;
  volume: number;
};

export default function MarketsSidebar() {
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [tab, setTab] = useState<"favorites" | "spot" | "trending">("spot");
  const [query, setQuery] = useState("");

  /* ----------------------------------------------------
     LOAD MARKETS (MEXC REST API)
     Firebase Studio WS issue → REST fallback
  -----------------------------------------------------*/
  const loadMarkets = async () => {
    try {
      const data = await fetch("https://api.mexc.com/api/v3/ticker/24hr").then(
        (r) => r.json()
      );

      if (!Array.isArray(data)) return;

      const parsed: Market[] = data
        .filter((m) => m.symbol.endsWith("USDT"))
        .map((m) => ({
          symbol: m.symbol,
          price: Number(m.lastPrice),
          change: Number(m.priceChangePercent),
          volume: Number(m.volume),
        }))
        .sort((a, b) => b.volume - a.volume);

      setAllMarkets(parsed);
    } catch (e) {
      console.warn("Markets load error", e);
    }
  };

  useEffect(() => {
    loadMarkets();
  }, []);

  /* ----------------------------------------------------
     FILTER + FAVORITES LOGIC
  -----------------------------------------------------*/
  const filtered = useMemo(() => {
    let list = [...allMarkets];

    // Search
    if (query.trim().length > 0) {
      const q = query.toUpperCase();
      list = list.filter((m) => m.symbol.includes(q));
    }

    // Tabs
    if (tab === "favorites") {
      list = list.filter((m) => favorites.includes(m.symbol));
    } else if (tab === "trending") {
      list = [...list].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }

    return list.slice(0, 60);
  }, [allMarkets, favorites, tab, query]);

  /* ----------------------------------------------------
     TOGGLE FAVORITE
  -----------------------------------------------------*/
  const toggleFav = (symbol: string) => {
    setFavorites((favs) =>
      favs.includes(symbol)
        ? favs.filter((s) => s !== symbol)
        : [...favs, symbol]
    );
  };

  /* ----------------------------------------------------
     ROW COMPONENT
  -----------------------------------------------------*/
  const Row = ({ m }: { m: Market }) => {
    const isFav = favorites.includes(m.symbol);
    const changeColor =
      m.change > 0 ? "text-chartgreen" : m.change < 0 ? "text-chartred" : "";

    return (
      <div className="relative flex items-center justify-between px-3 py-2 text-xs border-b border-[var(--border-color)] hover:bg-surface3/40 transition">
        <div className="flex flex-col">
          <Link
            href={`/trade/${m.symbol.replace('USDT', '-USDT')}`}
            className="font-medium text-[var(--text-primary)] hover:text-accent"
          >
            {m.symbol.replace("USDT", "")}/USDT
          </Link>

          <div className="flex gap-4 mt-[1px]">
            <span className="text-[var(--text-secondary)]">
              {m.price.toFixed(4)}
            </span>
            <span className={changeColor}>{m.change.toFixed(2)}%</span>
          </div>
        </div>

        <button onClick={() => toggleFav(m.symbol)}>
          <Star
            size={16}
            className={isFav ? "text-gold" : "text-[var(--text-secondary)]"}
            fill={isFav ? "var(--gold)" : "transparent"}
          />
        </button>
      </div>
    );
  };

  /* ----------------------------------------------------
     RENDER
  -----------------------------------------------------*/
  return (
    <div className="w-full h-full flex flex-col bg-surface1 border border-[var(--border-color)] rounded-xl overflow-hidden">
      {/* SEARCH */}
      <div className="p-3 border-b border-[var(--border-color)] bg-surface2">
        <input
          type="text"
          placeholder="Search markets"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg bg-surface3 border border-[var(--border-color)] focus:outline-none"
        />
      </div>

      {/* TABS */}
      <div className="flex text-sm border-b border-[var(--border-color)]">
        <button
          onClick={() => setTab("favorites")}
          className={`flex-1 py-2 ${
            tab === "favorites" ? "text-accent font-semibold" : "text-[var(--text-secondary)]"
          }`}
        >
          Favorites
        </button>

        <button
          onClick={() => setTab("spot")}
          className={`flex-1 py-2 ${
            tab === "spot" ? "text-accent font-semibold" : "text-[var(--text-secondary)]"
          }`}
        >
          Spot
        </button>

        <button
          onClick={() => setTab("trending")}
          className={`flex-1 py-2 ${
            tab === "trending" ? "text-accent font-semibold" : "text-[var(--text-secondary)]"
          }`}
        >
          Trending
        </button>
      </div>

      {/* MARKET LIST */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-xs text-[var(--text-secondary)]">
            No markets found
          </div>
        ) : (
          filtered.map((m) => <Row key={m.symbol} m={m} />)
        )}
      </div>
    </div>
  );
}
