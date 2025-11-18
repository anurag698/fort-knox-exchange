
"use client";

import { useMultiChart } from "./multi-chart-provider";
import { cn } from "@/lib/utils";

export function ChartLayoutToggle() {
  const { layout, updateLayout } = useMultiChart();

  return (
    <div className="flex gap-2 px-3 py-2 bg-[#0d0f12] border-b border-neutral-800">
      {["1", "2", "4"].map((mode) => (
        <button
          key={mode}
          className={cn(
            "px-2 py-1 text-sm rounded",
            layout === mode
              ? "bg-blue-500 text-white font-bold"
              : "bg-[#1a1d21] text-neutral-300 hover:bg-[#2a2e31]"
          )}
          onClick={() => updateLayout(mode)}
        >
          {mode} Chart
        </button>
      ))}
    </div>
  );
}
