"use client";

import { useEffect, useRef } from "react";
import MarketDataService from "../lib/market-data-service";
import { createChart } from "lightweight-charts";

export default function TradingChart({ symbol }: any) {
  const chartRef = useRef<any>();
  const candleSeries = useRef<any>();

  useEffect(() => {
    const chart = createChart(chartRef.current, {
      layout: { background: { color: "#111418" }, textColor: "#d1d4dc" },
      grid: { vertLines: { color: "#1c1f26" }, horzLines: { color: "#1c1f26" } },
      width: chartRef.current.clientWidth,
      height: 380,
    });

    const series = chart.addCandlestickSeries();
    candleSeries.current = series;

    const ws = MarketDataService.getInstance(symbol);
    ws.subscribeKline((kline: any) => {
      series.update(kline);
    });

    return () => {
      chart.remove();
    };
  }, [symbol]);

  return <div ref={chartRef} className="w-full h-[380px]" />;
}
