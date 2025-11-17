
"use client";

export default function MarketHeader({ symbol, ticker }: any) {
  const base = symbol.slice(0, -4).toUpperCase();
  const quote = symbol.slice(-4).toUpperCase();

  const price = ticker?.c ? parseFloat(ticker.c).toFixed(2) : "--";
  const change = ticker?.P ? `${parseFloat(ticker.P).toFixed(2)}%` : "--";

  return (
    <div className="flex items-center justify-between bg-[#111418] p-3 rounded-xl">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">{base}/{quote}</h2>
        <span className={`px-2 py-1 rounded text-sm ${
          parseFloat(ticker?.P || 0) >= 0 ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
        }`}>
          {change}
        </span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div>
          <div className="text-gray-400">24h High</div>
          <div>{ticker?.h || "--"}</div>
        </div>
        <div>
          <div className="text-gray-400">24h Low</div>
          <div>{ticker?.l || "--"}</div>
        </div>
        <div>
          <div className="text-gray-400">24h Volume</div>
          <div>{ticker?.v || "--"}</div>
        </div>
      </div>
    </div>
  );
}
