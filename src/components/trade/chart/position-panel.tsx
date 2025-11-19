"use client";

import React, { useState } from "react";

export default function PositionPanel({ apiRef }: { apiRef: React.MutableRefObject<any> }) {
  const [entries, setEntries] = useState<{ price: string; qty: string }[]>([
    { price: "", qty: "" },
  ]);
  const [side, setSide] = useState<"long" | "short">("long");

  const pushEntry = () => setEntries((s) => [...s, { price: "", qty: "" }]);
  const updateEntry = (idx: number, k: "price" | "qty", v: string) =>
    setEntries((s) => s.map((e, i) => (i === idx ? { ...e, [k]: v } : e)));

  const applyPosition = () => {
    const api = apiRef.current;
    if (!api) return;
    const ui = api.engine.ui || api.ui;
    if (!ui) return;

    const parsed = entries
      .filter((e) => e.price && e.qty)
      .map((e) => ({ price: parseFloat(e.price), size: parseFloat(e.qty) }));

    if (typeof ui.setEntries === "function") {
      ui.setEntries(parsed);
    }
    if (typeof ui.updatePositionPnl === "function") {
      // build a simple position summary
      const totalQty = parsed.reduce((s, p) => s + p.size, 0);
      const avg = parsed.reduce((s, p) => s + p.price * p.size, 0) / (totalQty || 1);
      ui.updatePositionPnl({ avgEntry: avg, size: totalQty, side });
    }
  };

  return (
    <div className="bg-black/60 p-3 rounded text-white w-64">
      <div className="flex items-center gap-2 mb-2">
        <button className={`px-2 py-1 rounded ${side === "long" ? "bg-green-600" : "bg-transparent"}`} onClick={() => setSide("long")}>Long</button>
        <button className={`px-2 py-1 rounded ${side === "short" ? "bg-red-600" : "bg-transparent"}`} onClick={() => setSide("short")}>Short</button>
        <div className="flex-1 text-xs opacity-70">Position</div>
      </div>

      {entries.map((e, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input placeholder="price" value={e.price} onChange={(ev) => updateEntry(i, "price", ev.target.value)} className="flex-1 px-2 py-1 bg-white/5 rounded" />
          <input placeholder="qty" value={e.qty} onChange={(ev) => updateEntry(i, "qty", ev.target.value)} className="w-20 px-2 py-1 bg-white/5 rounded" />
        </div>
      ))}

      <div className="flex gap-2">
        <button className="px-2 py-1 rounded bg-slate-700" onClick={pushEntry}>+ Entry</button>
        <button className="px-2 py-1 rounded bg-blue-600" onClick={applyPosition}>Apply</button>
      </div>
    </div>
  );
}
