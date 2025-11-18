// src/components/trade/chart-area.tsx
"use client";

import React from "react";

export default function ChartArea({ children }: { children?: React.ReactNode }) {
  return (
    <div className="w-full h-full">
      {children ?? (
        <div className="text-slate-400 text-sm p-4">
          Chart Area Loaded — waiting for chart component...
        </div>
      )}
    </div>
  );
}
