"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  interval: string;
  chartType: "candles" | "line" | "area";
};

export default function ChartShell({ symbol, interval, chartType }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

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

      {/* Placeholder preview */}
      {ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 pointer-events-none select-none">
          <div className="text-xs text-[var(--text-secondary)]">
            Chart will load…
          </div>
          <div className="mt-2 w-2/3 h-40 bg-surface3 rounded-lg" />
        </div>
      )}
    </div>
  );
}
