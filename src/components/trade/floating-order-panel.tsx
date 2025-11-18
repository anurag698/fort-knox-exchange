
'use client';

import React from 'react';

export default function FloatingOrderPanel({ marketId }: { marketId: string }) {
  // Controlled via props or store in your real app
  return (
    <div className="w-[360px] bg-[#07121a]/95 border border-[#1f2937] rounded-xl shadow-xl p-4 text-sm">
      <div className="flex items-center gap-3 mb-4">
        <button className="px-4 py-2 bg-green-500 text-white rounded-md font-medium">Buy</button>
        <button className="px-4 py-2 bg-[#1f2937] text-white rounded-md">Sell</button>
      </div>

      <div className="mb-3">
        <div className="text-xs text-[#9aa3ad] mb-1">Price</div>
        <input className="w-full bg-[#0b1220] border border-[#132028] rounded px-3 py-2" defaultValue="0.00" />
      </div>

      <div className="mb-3">
        <div className="text-xs text-[#9aa3ad] mb-1">Amount</div>
        <input className="w-full bg-[#0b1220] border border-[#132028] rounded px-3 py-2" defaultValue="0.00" />
      </div>

      <div className="flex gap-2 mb-3">
        <button className="flex-1 text-xs px-2 py-1 bg-[#0f1720] border border-[#1f2937] rounded">25%</button>
        <button className="flex-1 text-xs px-2 py-1 bg-[#0f1720] border border-[#1f2937] rounded">50%</button>
        <button className="flex-1 text-xs px-2 py-1 bg-[#0f1720] border border-[#1f2937] rounded">75%</button>
        <button className="flex-1 text-xs px-2 py-1 bg-[#0f1720] border border-[#1f2937] rounded">100%</button>
      </div>

      <div className="mb-4">
        <label className="inline-flex items-center gap-2 text-xs">
          <input type="checkbox" className="accent-green-500" /> Post Only
        </label>
        <label className="inline-flex items-center gap-2 ml-4 text-xs">
          <input type="checkbox" className="accent-red-500" /> Reduce Only
        </label>
      </div>

      <button className="w-full bg-green-500 text-white rounded-lg py-3 font-semibold">Buy {marketId}</button>
    </div>
  );
}
