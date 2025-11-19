// ======================================================
// Data Adapter: MEXC → Fort Knox Chart Format
// ======================================================

export function adaptKline(k: any) {
  return {
    t: k.t,
    o: parseFloat(k.o),
    h: parseFloat(k.h),
    l: parseFloat(k.l),
    c: parseFloat(k.c),
    v: parseFloat(k.v),
  };
}

export function adaptTicker(t: any) {
  return {
    last: parseFloat(t.last ?? t.askPrice ?? 0),
    bid: parseFloat(t.bidPrice ?? 0),
    ask: parseFloat(t.askPrice ?? 0),
    symbol: t.symbol,
  };
}

export function adaptTrades(trades: any[]) {
  return trades.map((t) => ({
    price: parseFloat(t.p),
    volume: parseFloat(t.v),
    ts: t.t,
    side: t.S === "buy" ? "buy" : "sell",
  }));
}

export function adaptDepth(d: any) {
  return {
    bids: d.bids.map((x: any) => [parseFloat(x[0]), parseFloat(x[1])]),
    asks: d.asks.map((x: any) => [parseFloat(x[0]), parseFloat(x[1])]),
  };
}
