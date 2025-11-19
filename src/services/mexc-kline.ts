// ======================================================
// MEXC Historical Kline Fetcher (REST)
// ======================================================

const BASE = "https://api.mexc.com";

export async function fetchMEXCKlines(
  symbol: string,
  interval: string = "1m",
  limit: number = 500
) {
  const url = `${BASE}/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch MEXC klines");
  }

  const raw = await res.json();

  return raw.map((c: any) => ({
    t: c[0],
    o: parseFloat(c[1]),
    h: parseFloat(c[2]),
    l: parseFloat(c[3]),
    c: parseFloat(c[4]),
    v: parseFloat(c[5]),
  }));
}
