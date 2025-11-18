"use client";

import { useState, useEffect } from "react";

export function useSparkline(marketId: string) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!marketId) return;

    async function load() {
      // 1h history → 60 candles
      const url = `https://api.binance.com/api/v3/klines?symbol=${marketId.replace(
        "-",
        ""
      )}&interval=1m&limit=60`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch sparkline data");
        const json = await res.json();

        if (Array.isArray(json)) {
          const points = json.map((candle) => ({
            time: candle[0] / 1000,
            value: parseFloat(candle[4]),
          }));

          setData(points);
        }
      } catch (err) {
        console.error(`Sparkline error for ${marketId}:`, err);
      }
    }

    load();
    // Optional: Add a timer to refresh sparklines periodically
    const interval = setInterval(load, 60000); // every minute
    return () => clearInterval(interval);

  }, [marketId]);

  return { data };
}
