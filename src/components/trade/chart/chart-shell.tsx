"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import ChartEngine from "./chart-engine";

type Props = {
  symbol: string;
  interval: string;
  chartType: "candles" | "line" | "area";
};

function isFirebaseStudio() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.includes("firebase");
}

export default function ChartShell({ symbol, interval, chartType }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const BLOCK_WS = isFirebaseStudio();

  // Simulate async mounting (chart engine loads in part 12)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, [symbol, interval, chartType]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full bg-surface1 border border-[var(--border-color)] rounded-xl relative overflow-hidden"
      )}
    >
      {/* Loading shimmer */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-secondary)] text-xs">
          Loading chart…
        </div>
      )}

      {ready && !BLOCK_WS && (
        <ChartEngine symbol={symbol} interval={interval} chartType={chartType} />
      )}

      {ready && BLOCK_WS && (
        <div className="absolute inset-0 flex items-center justify-center opacity-40 text-[var(--text-secondary)]">
          Real chart disabled in Firebase Studio preview.
        </div>
      )}
    </div>
  );
}
