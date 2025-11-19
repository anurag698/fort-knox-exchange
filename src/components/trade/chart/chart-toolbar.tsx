"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  CandlestickChart,
  Wand2,
  Eraser,
  ChevronDown,
  Square,
} from "lucide-react";
import { useChartIndicator } from "@/hooks/useChartIndicator";
import { useDrawingTool } from "@/hooks/useDrawingTool";

type Props = {
  interval: string;
  setInterval: (i: string) => void;
  chartType: "candles" | "line" | "area";
  setChartType: (t: "candles" | "line" | "area") => void;
  onReset?: () => void;
  setTP: (price: number) => void;
  setSL: (price: number) => void;
  onAddEntry: (price: number, size: number) => void;
  onRemoveEntry: (id: string) => void;
  addTP: (price: number, size: number) => void;
  removeTP: (id: string) => void;
};

const Toggle = ({ label, keyName }: any) => {
  const [enabled, setEnabled] = useChartIndicator(keyName);
  return (
    <div
      className="flex justify-between items-center py-1 cursor-pointer"
      onClick={() => setEnabled(!enabled)}
    >
      <span>{label}</span>
      <span
        className={enabled ? "text-accent font-semibold" : "text-[var(--text-secondary)]"}
      >
        {enabled ? "ON" : "OFF"}
      </span>
    </div>
  );
};

const DrawToggle = ({ tool, label }: any) => {
  const [current, setCurrent] = useDrawingTool();
  return (
    <div
      onClick={() => setCurrent(tool)}
      className="flex justify-between cursor-pointer hover:text-accent"
    >
      <span>{label}</span>
      <span
        className={
          current === tool
            ? "text-accent font-semibold"
            : "text-[var(--text-secondary)]"
        }
      >
        {current === tool ? "●" : "○"}
      </span>
    </div>
  );
};


export default function ChartToolbar({
  interval,
  setInterval,
  chartType,
  setChartType,
  onReset,
  setTP,
  setSL,
  onAddEntry,
  onRemoveEntry,
  addTP,
  removeTP,
}: Props) {
  const [indOpen, setIndOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);

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

      {/* ---------------- INDICATORS DROPDOWN ---------------- */}
      <div className="relative">
        <button
          onClick={() => setIndOpen((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-[var(--text-secondary)] hover:text-accent"
        >
          <Wand2 size={14} /> Indicators <ChevronDown size={12} />
        </button>

        {indOpen && (
          <div className="absolute left-0 top-8 bg-surface3 border border-[var(--border-color)] rounded-lg p-3 text-xs w-48 z-50">
            <Toggle label="SMA 5" keyName="sma5" />
            <Toggle label="SMA 20" keyName="sma20" />
            <Toggle label="EMA 20" keyName="ema20" />
            <Toggle label="EMA 50" keyName="ema50" />
            <Toggle label="RSI" keyName="rsi" />
            <Toggle label="Bollinger Bands" keyName="bb" />
          </div>
        )}
      </div>
      
        {/* ---------------- DRAWING TOOLS ---------------- */}
        <div className="relative">
        <button
            onClick={() => setDrawOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-[var(--text-secondary)] hover:text-accent"
        >
            ✏️ Draw <ChevronDown size={12} />
        </button>

        {drawOpen && (
            <div className="absolute left-0 top-8 bg-surface3 border border-[var(--border-color)] rounded-lg p-3 text-xs w-48 z-50 flex flex-col gap-2">
            <DrawToggle tool="trendline" label="Trend Line" />
            <DrawToggle tool="ray" label="Ray" />
            <DrawToggle tool="hline" label="Horizontal Line" />
            <DrawToggle tool="rectangle" label="Rectangle" />
            <DrawToggle tool="none" label="Disable Drawing" />
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
          <CandlestickChart size={16} />
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

       <button
        onClick={() => {
          const p = prompt("Set Take-Profit at price:");
          if (!p) return;
          setTP(parseFloat(p));
        }}
        className="px-2 py-1 text-xs rounded bg-surface2 hover:bg-surface3"
      >
        Set TP
      </button>

      <button
        onClick={() => {
          const p = prompt("Set Stop-Loss at price:");
          if (!p) return;
          setSL(parseFloat(p));
        }}
        className="px-2 py-1 text-xs rounded bg-surface2 hover:bg-surface3"
      >
        Set SL
      </button>

       <button
        onClick={() => {
          const price = parseFloat(prompt("Entry price:") || "");
          const size = parseFloat(prompt("Position size:") || "");
          if (!price || !size) return;
          onAddEntry(price, size);
        }}
        className="px-2 py-1 text-xs rounded bg-surface2 hover:bg-surface3"
      >
        + Add Entry
      </button>

      <button
        onClick={() => {
          const id = prompt("Entry ID to remove:");
          if (!id) return;
          onRemoveEntry(id);
        }}
        className="px-2 py-1 text-xs rounded bg-surface2 hover:bg-surface3"
      >
        – Remove Entry
      </button>
      
       <button
        onClick={() => {
          const price = parseFloat(prompt("TP price:") || "");
          const size = parseFloat(prompt("TP size %:") || "");
          if (!price || !size) return;
          addTP(price, size);
        }}
        className="px-2 py-1 text-xs rounded bg-surface2 hover:bg-surface3"
      >
        + Add TP Target
      </button>

      <button
        onClick={() => {
          const id = prompt("TP ID to remove:");
          if (!id) return;
          removeTP(id);
        }}
        className="px-2 py-1 text-xs rounded bg-surface2 hover:bg-surface3"
      >
        – Remove TP Target
      </button>


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
