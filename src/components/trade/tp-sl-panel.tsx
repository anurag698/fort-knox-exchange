// src/components/trade/tp-sl-panel.tsx
"use client";

import React, { useState } from "react";

export default function TpSlPanel({ onSet }: { onSet?: (list: any) => void }) {
  const [tp, setTp] = useState<number | "">("");
  const [sl, setSl] = useState<number | "">("");

  return (
    <div className="tp-sl-panel">
      <h4>TP / SL</h4>
      <label>TP</label>
      <input type="number" value={tp === "" ? "" : tp} onChange={(e)=>setTp(e.target.value === "" ? "" : Number(e.target.value))} />
      <label>SL</label>
      <input type="number" value={sl === "" ? "" : sl} onChange={(e)=>setSl(e.target.value === "" ? "" : Number(e.target.value))} />
      <button onClick={() => onSet?.([{ price: tp, type: "tp" }, { price: sl, type: "sl" }])}>Set</button>
    </div>
  );
}
