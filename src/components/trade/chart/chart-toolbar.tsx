// src/components/trade/chart/chart-toolbar.tsx
"use client";

import React from "react";

interface ChartToolbarProps {
  engineApi: any;
  chartType: string;
  onChartTypeChange: (type: string) => void;
}

export default function ChartToolbar({ 
  engineApi, 
  chartType, 
  onChartTypeChange 
}: ChartToolbarProps) {
  const ui = engineApi;

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {/* Chart Type Selector */}
      <div style={{ display: "flex", gap: "4px", border: "1px solid #ccc", borderRadius: "4px", padding: "2px" }}>
        <button 
          onClick={() => onChartTypeChange("candlestick")}
          className={`px-2 py-1 rounded ${chartType === "candlestick" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          title="Candlestick Chart"
        >
          📊
        </button>
        <button 
          onClick={() => onChartTypeChange("line")}
          className={`px-2 py-1 rounded ${chartType === "line" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          title="Line Chart"
        >
          📈
        </button>
        <button 
          onClick={() => onChartTypeChange("area")}
          className={`px-2 py-1 rounded ${chartType === "area" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          title="Area Chart"
        >
          📉
        </button>
      </div>

      {/* Drawing Tools */}
      <div style={{ display: "flex", gap: "4px", border: "1px solid #ccc", borderRadius: "4px", padding: "2px" }}>
        <button 
          onClick={() => ui?.enableTrendTool?.()}
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
          title="Trend Line"
        >
          ⟋
        </button>
        <button 
          onClick={() => ui?.enableHorizontalLine?.()}
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
          title="Horizontal Line"
        >
          ―
        </button>
        <button 
          onClick={() => ui?.enableVerticalLine?.()}
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
          title="Vertical Line"
        >
          |
        </button>
      </div>

      {/* Indicators Dropdown */}
      <div style={{ position: "relative" }}>
        <select 
          onChange={(e) => {
            const indicator = e.target.value;
            if (indicator === "SMA") ui?.addSMA?.(20);
            else if (indicator === "EMA") ui?.addEMA?.(20);
            else if (indicator === "RSI") ui?.addRSI?.(14);
            else if (indicator === "MACD") ui?.addMACD?.();
            else if (indicator === "BB") ui?.addBollingerBands?.(20, 2);
            e.target.value = ""; // Reset selection
          }}
          className="px-2 py-1 rounded bg-gray-200 border border-gray-300"
          defaultValue=""
        >
          <option value="" disabled>Indicators</option>
          <option value="SMA">SMA (20)</option>
          <option value="EMA">EMA (20)</option>
          <option value="RSI">RSI (14)</option>
          <option value="MACD">MACD</option>
          <option value="BB">Bollinger Bands</option>
        </select>
      </div>

      {/* Zoom Controls */}
      <div style={{ display: "flex", gap: "4px", border: "1px solid #ccc", borderRadius: "4px", padding: "2px" }}>
        <button 
          onClick={() => ui?.zoomIn?.()}
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={() => ui?.zoomOut?.()}
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
          title="Zoom Out"
        >
          −
        </button>
        <button 
          onClick={() => ui?.resetZoom?.()}
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
          title="Reset Zoom"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
