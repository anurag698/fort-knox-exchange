
"use client";

import { useEffect, useState, useMemo } from "react";

// -------------------------------
// Clipboard Safe Copy
// -------------------------------
async function safeCopy(text: string) {
  if (typeof navigator === "undefined") return;
  if (!navigator.clipboard || !window.isSecureContext) {
    console.warn("Clipboard not available here");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.warn("Clipboard failed:", e);
  }
}

// -------------------------------
// WebSocket Hook for Orderbook
// -------------------------------
function useBinanceOrderBook(symbol: string) {
  const [bids, setBids] = useState<any[][]>([]);
  const [asks, setAsks] = useState<any[][]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (!symbol) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      const stream = `${symbol.toLowerCase()}@depth20@100ms`;
      console.log("Connecting to Binance WS:", stream);

      ws = new WebSocket(`wss://stream.binance.com/ws/${stream}`);

      ws.onopen = () => {
        console.log("WS Connected:", stream);
      };

      ws.onmessage = (msg) => {
        try {
          console.log("RAW BINANCE DATA:", msg.data);
          const data = JSON.parse(msg.data);

          if (data.b && Array.isArray(data.b)) setBids(data.b);
          if (data.a && Array.isArray(data.a)) setAsks(data.a);

          setLastUpdate(Date.now());
        } catch (err) {
          console.log("Parse error:", err);
        }
      };

      ws.onerror = (err) => {
        console.log("WS error:", err);
      };

      ws.onclose = () => {
        console.log("WS closed → reconnecting...");
        reconnectTimer = setTimeout(connect, 1500);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, [symbol]);

  return { bids, asks, lastUpdate };
}

// -------------------------------
// MAIN TRADE PAGE CLIENT COMPONENT
// -------------------------------
export default function TradePageClient({ marketId }: { marketId: string }) {
  const symbol = marketId.replace("-", "").toLowerCase(); // BTC-USDT → btcusdt

  const { bids, asks } = useBinanceOrderBook(symbol);

  // ---------------------------------------------
  // Calculate Mid Price (fully safe)
  // ---------------------------------------------
  const midPrice = useMemo(() => {
    if (!Array.isArray(bids) || !Array.isArray(asks)) return null;
    if (bids.length === 0 || asks.length === 0) return null;

    const bestBid = parseFloat(bids[0][0]);
    const bestAsk = parseFloat(asks[0][0]);

    if (Number.isNaN(bestBid) || Number.isNaN(bestAsk)) return null;

    return (bestBid + bestAsk) / 2;
  }, [bids, asks]);

  // ---------------------------------------------
  // RENDER UI
  // ---------------------------------------------
  return (
    <div className="p-4 space-y-4">

      <h1 className="text-xl font-semibold">
        {symbol.toUpperCase()} — Live Trading
      </h1>

      {/* Mid Price */}
      <div className="bg-gray-900 p-4 rounded-xl text-lg">
        Mid Price:{" "}
        {midPrice ? (
          <span className="text-green-400">{midPrice.toFixed(2)}</span>
        ) : (
          <span className="text-gray-500">Loading…</span>
        )}
      </div>

      {/* Order Book */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="font-semibold mb-2">Bids</h2>
          {bids && bids.length > 0 ? (
            bids.slice(0, 10).map(([price, qty], i) => (
              <div
                key={i}
                className="flex justify-between text-green-400 hover:bg-gray-700 px-2 rounded"
              >
                <span>{parseFloat(price).toFixed(2)}</span>
                <span>{qty}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500">Waiting for data…</div>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="font-semibold mb-2">Asks</h2>
          {asks && asks.length > 0 ? (
            asks.slice(0, 10).map(([price, qty], i) => (
              <div
                key={i}
                className="flex justify-between text-red-400 hover:bg-gray-700 px-2 rounded"
              >
                <span>{parseFloat(price).toFixed(2)}</span>
                <span>{qty}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500">Waiting for data…</div>
          )}
        </div>
      </div>

      {/* Copy Button Example */}
      <button
        onClick={() => safeCopy(marketId)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        Copy Market ID
      </button>
    </div>
  );
}
