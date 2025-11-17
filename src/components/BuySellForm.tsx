
"use client";

export default function BuySellForm({ symbol }: any) {
  return (
    <div className="bg-[#0e1117] p-3 rounded-xl text-sm">

      <div className="flex gap-2 mb-3">
        <button className="flex-1 bg-green-600/20 text-green-400 p-2 rounded">Buy</button>
        <button className="flex-1 bg-red-600/20 text-red-400 p-2 rounded">Sell</button>
      </div>

      <label className="text-gray-400">Price</label>
      <input className="w-full bg-gray-800 p-2 rounded mb-3" />

      <label className="text-gray-400">Amount</label>
      <input className="w-full bg-gray-800 p-2 rounded mb-3" />

      <button className="w-full mt-2 bg-green-500 p-2 rounded text-black font-bold">
        Buy {symbol.slice(0, -4).toUpperCase()}
      </button>
    </div>
  );
}
