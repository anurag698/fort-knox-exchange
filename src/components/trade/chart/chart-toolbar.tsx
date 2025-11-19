"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Candle,
  Wand2,
  Eraser,
  ChevronDown,
  Square,
} from "lucide-react";

type Props = {
  interval: string;
  setInterval: (i: string) => void;

  chartType: "candles" | "line" | "area";
  setChartType: (t: "candles" | "line" | "area") => void;

  onReset?: () => void;
};

export default function ChartToolbar({
  interval,
  setInterval,
  chartType,
  setChartType,
  onReset,
}: Props) {
  const [indOpen, setIndOpen] = useState(false);

  const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

  return (
    <div className="w-full h-11 bg-surface2 border border-[var(--border-color)] rounded-xl mb-2 flex items-center px-3 gap-3">
      
      {/* ---------------- TIMEFRAMES ---------------- */}
      <div className="flex gap-1">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            className={cn(
              "px-2 py-1 text-xs rounded-md",
              interval === t
                ? "bg-accent/20 text-accent font-semibold"
                : "text-[var(--text-secondary)] hover:text-accent"
            )}
            onClick={() => setInterval(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ---------------- INDICATORS ---------------- */}
      <div className="relative">
        <button
          onClick={() => setIndOpen((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-[var(--text-secondary)] hover:text-accent"
        >
          <Wand2 size={14} /> Indicators <ChevronDown size={12} />
        </button>

        {indOpen && (
          <div className="absolute left-0 top-8 bg-surface3 border border-[var(--border-color)] rounded-lg p-3 text-xs w-40 z-50">
            <div className="flex flex-col gap-2">
              <span className="text-[var(--text-secondary)]">Coming Soon:</span>
              <span className="text-[var(--text-primary)]">RSI</span>
              <span className="text-[var(--text-primary)]">EMA</span>
              <span className="text-[var(--text-primary)]">Bollinger Bands</span>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- CHART TYPE ---------------- */}
      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={() => setChartType("candles")}
          className={cn(
            "p-1 rounded-md",
            chartType === "candles"
              ? "bg-accent/20 text-accent"
              : "text-[var(--text-secondary)] hover:text-accent"
          )}
        >
          <Candle size={16} />
        </button>

        <button
          onClick={() => setChartType("line")}
          className={cn(
            "p-1 rounded-md",
            chartType === "line"
              ? "bg-accent/20 text-accent"
              : "text-[var(--text-secondary)] hover:text-accent"
          )}
        >
          <LineChart size={16} />
        </button>

        <button
          onClick={() => setChartType("area")}
          className={cn(
            "p-1 rounded-md",
            chartType === "area"
              ? "bg-accent/20 text-accent"
              : "text-[var(--text-secondary)] hover:text-accent"
          )}
        >
          <Square size={16} />
        </button>
      </div>

      {/* ---------------- RESET CHART ---------------- */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={onReset}
          className="px-2 py-1 text-xs rounded-md text-[var(--text-secondary)] hover:text-accent flex items-center gap-1"
        >
          <Eraser size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
