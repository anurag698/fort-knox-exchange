"use client";

import React, { useState } from "react";

export default function TpSlPanel({ apiRef, symbol }: { apiRef: React.MutableRefObject<any>; symbol: string }) {
  const [tp, setTp] = useState<string>("");
  const [sl, setSl] = useState<string>("");

  const apply = () => {
    const api = apiRef.current;
    if (!api) return;
    const ui = api.engine.ui || api.ui;
    if (!ui) return;

    const list = [];
    if (tp) list.push({ price: parseFloat(tp), type: "tp" });
    if (sl) list.push({ price: parseFloat(sl), type: "sl" });

    if (typeof ui.setTPSL === "function") {
      ui.setTPSL(list);
    } else {
      console.warn("ui.setTPSL not available");
    }
  };

  return (
    <div className="bg-black/60 p-3 rounded space-y-2 text-white">
      <div className="text-xs opacity-80">TP / SL</div>
      <div className="flex gap-2">
        <input className="px-2 py-1 rounded bg-white/5" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="TP price" />
        <input className="px-2 py-1 rounded bg-white/5" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="SL price" />
        <button className="px-3 py-1 bg-green-600 rounded" onClick={apply}>Set</button>
      </div>
      <div className="text-xs opacity-60">{symbol}</div>
    </div>
  );
}
