// ======================================================
// MEXC Depth Snapshot (REST)
// ======================================================

const BASE = "https://api.mexc.com";

export async function fetchMEXCDepth(symbol: string, limit = 50) {
  const url = `${BASE}/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=${limit}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch MEXC depth");
  }

  const raw = await res.json();

  return {
    bids: raw.bids.map((b: any) => [parseFloat(b[0]), parseFloat(b[1])]),
    asks: raw.asks.map((a: any) => [parseFloat(a[0]), parseFloat(a[1])]),
  };
}
