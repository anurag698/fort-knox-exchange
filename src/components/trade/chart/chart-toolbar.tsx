"use client";

import React from "react";

export default function ChartToolbar({ apiRef }: { apiRef: React.MutableRefObject<any> }) {
  const call = (fn: string, ...args: any[]) => {
    const api = apiRef.current;
    if (!api || !api.engine) {
      console.warn("Engine not ready");
      return;
    }
    const ui = api.engine.ui || api.ui;
    if (ui && typeof ui[fn] === "function") {
      ui[fn](...args);
    } else {
      console.warn("UI method not available:", fn);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button className="px-3 py-1 rounded bg-yellow-500 text-black" onClick={() => call("addSMA", 20)}>SMA 20</button>
      <button className="px-3 py-1 rounded bg-pink-500 text-white" onClick={() => call("addEMA", 20)}>EMA 20</button>
      <button className="px-3 py-1 rounded bg-indigo-500 text-white" onClick={() => call("addRSI", 14)}>RSI</button>
      <button className="px-3 py-1 rounded bg-slate-700 text-white" onClick={() => call("enableTrendTool")}>Trend</button>
      <button className="px-3 py-1 rounded bg-slate-700 text-white" onClick={() => call("enableFreeDraw")}>Free Draw</button>
      <button className="px-3 py-1 rounded bg-slate-700 text-white" onClick={() => call("zoomIn")}>+</button>
      <button className="px-3 py-1 rounded bg-slate-700 text-white" onClick={() => call("zoomOut")}>−</button>
      <button className="px-3 py-1 rounded bg-slate-700 text-white" onClick={() => call("resetZoom")}>Reset</button>
    </div>
  );
}
