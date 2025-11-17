// src/app/api/marketdata/candles/route.ts
import { NextResponse } from "next/server";

function generateCandles(pair: string, interval: string, from: number, to: number) {
  const intervalMs = interval === "1m" ? 60 * 1000 : 60 * 1000;
  const res = [];
  let last = 30000;
  for (let t = from * 1000; t <= to * 1000; t += intervalMs) {
    const o = last;
    const c = o + (Math.random() - 0.5) * 200;
    const h = Math.max(o, c) + Math.random() * 50;
    const l = Math.min(o, c) - Math.random() * 50;
    const v = Math.random() * 50;
    res.push({ t, o, h, l, c, v });
    last = c;
  }
  return res;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pair = url.searchParams.get("pair") || "BTC-USDT";
  const interval = url.searchParams.get("interval") || "1m";
  const from = Number(url.searchParams.get("from")) || Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  const to = Number(url.searchParams.get("to")) || Math.floor(Date.now() / 1000);

  // In production: read from your time-series DB (ClickHouse / Timescale) or Redis cache.
  const data = generateCandles(pair, interval, from, to);

  return NextResponse.json(data);
}
