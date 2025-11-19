
"use client";

import React, { useState } from "react";
import LightweightProChart from "./lightweight-pro-chart";
import { Maximize2, Minimize2, Camera, Bell, Clock } from "lucide-react";

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"];

export default function TradingChartContainer({ pair }: { pair: string }) {
  const [interval, setInterval] = useState("1m");
  const [fullscreen, setFullscreen] = useState(false);

  const captureChart = () => {
    const canvas = document.querySelector("#chart-screenshot-target canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${pair}-${interval}-chart.png`;
    link.href = (canvas as HTMLCanvasElement).toDataURL("image/png");
    link.click();
  };

  return (
    <div
      className={`relative w-full h-full transition ${
        fullscreen ? "fixed inset-0 z-[9999] bg-[var(--bg-primary)]" : ""
      }`}
    >
      {/* ---------------- CHART TOOLBAR ---------------- */}
      <div className="absolute z-20 top-2 left-2 flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md px-2 py-1 shadow-md">
        
        {/* Interval buttons */}
        <div className="flex items-center gap-1">
          {INTERVALS.map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={`px-2 py-1 text-xs rounded-md transition ${
                interval === i
                  ? "bg-[var(--brand-blue)] text-white shadow-fort-glow"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        {/* Screenshot */}
        <button
          onClick={captureChart}
          className="p-1 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
        >
          <Camera size={16} />
        </button>

        {/* Price alerts (placeholder) */}
        <button className="p-1 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]">
          <Bell size={16} />
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => setFullscreen((v) => !v)}
          className="p-1 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
        >
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* ---------------- CHART RENDER ---------------- */}
      <div id="chart-screenshot-target" className="w-full h-full">
        <LightweightProChart pair={pair} interval={interval} />
      </div>
    </div>
  );
}
