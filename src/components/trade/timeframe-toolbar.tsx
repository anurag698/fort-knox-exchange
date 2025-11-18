"use client";

import { cn } from "@/lib/utils";

const intervals = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function TimeframeToolbar({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (interval: string) => void;
}) {
  return (
    <div className="flex gap-2 px-3 py-2 bg-[#0d0f12] border-b border-neutral-800">
      {intervals.map((int) => (
        <button
          key={int}
          onClick={() => onChange(int)}
          className={cn(
            "px-3 py-1 text-sm rounded",
            selected === int
              ? "bg-yellow-500 text-black font-semibold"
              : "text-neutral-300 hover:bg-[#1a1d21]"
          )}
        >
          {int.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
