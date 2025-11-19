// src/components/trade/lightweight-pro-chart.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

// small helper to safely send to a WebSocket (queue until open)
function safeWsSend(ws: WebSocket | null, msg: any) {
  if (!ws) return;
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
      return;
    }
    const onOpen = () => {
      try {
        if (ws.readyState === WebSocket.OPEN) ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
      } catch {}
      ws.removeEventListener("open", onOpen);
    };
    ws.addEventListener("open", onOpen);
  } catch (e) {}
}

export default function LightweightProChart({ pair = "BTC-USDT", wsUrl = "", interval = "1m", height = 600 } : any) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, { width: containerRef.current.clientWidth, height, crosshair: { mode: CrosshairMode.Normal }});
    chartRef.current = chart;
    candleSeriesRef.current = chart.addCandlestickSeries();

    // tooltip
    const tooltip = document.createElement("div");
    tooltip.style.cssText = "position:absolute;display:none;padding:6px;background:rgba(0,0,0,0.6);color:#fff;border-radius:4px;font-size:12px;pointer-events:none;z-index:10";
    containerRef.current.appendChild(tooltip);

    const handleCrosshairMove = (param: any) => {
      try {
        if (!param || !param.time || !chartRef.current || !candleSeriesRef.current) {
          tooltip.style.display = "none";
          return;
        }

        const logicalRange = chartRef.current.timeScale?.().getVisibleLogicalRange?.();
        if (!logicalRange) {
          tooltip.style.display = "none";
          return;
        }

        const barsFn = (candleSeriesRef.current as any).barsInLogicalRange;
        const bars = barsFn ? barsFn.call(candleSeriesRef.current, logicalRange) : null;
        if (!bars) { tooltip.style.display = "none"; return; }

        const priceObj = param?.seriesPrices?.get?.(candleSeriesRef.current) ?? null;
        if (!priceObj) { tooltip.style.display = "none"; return; }

        let html = "";
        if (typeof priceObj === "object") {
          html = `O:${priceObj.open?.toFixed?.(6) ?? "-"} H:${priceObj.high?.toFixed?.(6) ?? "-"} L:${priceObj.low?.toFixed?.(6) ?? "-"} C:${priceObj.close?.toFixed?.(6) ?? "-"}`;
        } else {
          html = `price: ${Number(priceObj).toFixed(6)}`;
        }

        tooltip.innerHTML = html;
        tooltip.style.display = "block";
        const x = param.point?.x ?? 10;
        const y = param.point?.y ?? 10;
        tooltip.style.left = `${x + 12}px`;
        tooltip.style.top = `${y + 12}px`;
      } catch (e) {
        tooltip.style.display = "none";
      }
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      try {
        chart.unsubscribeCrosshairMove(handleCrosshairMove);
      } catch {}
      try { chart.remove(); } catch {}
    };
  }, [height]);

  // WS connect only if wsUrl provided (chart-local feed)
  useEffect(() => {
    if (!wsUrl) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      // subscribe safely
      safeWsSend(ws, { type: "subscribe", pair: pair.replace("-", ""), interval });
    };
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        // handle messages according to your server - adapt if necessary
        if (m.type === "kline" && m.candle) {
          const c = m.candle;
          const lc = { time: Math.floor(c.t / 1000), open: c.o, high: c.h, low: c.l, close: c.c };
          candleSeriesRef.current?.update(lc);
        } else if (m.type === "snapshot" && Array.isArray(m.candles)) {
          const data = m.candles.map((c: any) => ({ time: Math.floor(c.t / 1000), open: c.o, high: c.h, low: c.l, close: c.c }));
          candleSeriesRef.current?.setData(data);
        }
      } catch (e) {
        console.warn("ws parse", e);
      }
    };
    ws.onerror = (ev) => {
      try { console.warn("WS error", (ev as any)?.message ?? ev); } catch {}
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => { try { ws.close(); } catch {} wsRef.current = null; };
  }, [wsUrl, pair, interval]);

  return <div ref={containerRef} style={{ width: "100%", height, position: "relative" }} />;
}
