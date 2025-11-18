"use client";

import { useEffect, useRef } from "react";
import MarketDataService from "../lib/market-data-service";
import { createChart, ColorType } from "lightweight-charts";

export default function TradingChart({ symbol }: { symbol: string }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const candleSeries = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Create chart
    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: "#111418" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#1c1f26" },
        horzLines: { color: "#1c1f26" },
      },
      width: chartRef.current.clientWidth,
      height: 350,
      crosshair: {
        mode: 1,
      },
    });

    // Add candlestick series
    const series = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    candleSeries.current = series;

    // Subscribe to market data
    const service = MarketDataService.getInstance(symbol);

    const unsub = service.subscribeKline((kline: any) => {
      series.update({
        time: Math.floor(kline.time / 1000) as any,
        open: kline.open,
        high: kline.high,
        low: kline.low,
        close: kline.close,
      });
    });

    // Resize chart dynamically
    const handleResize = () => {
      if (chartRef.current) {
        chart.resize(chartRef.current.clientWidth, 350);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      unsub && unsub();
      chart.remove();
    };
  }, [symbol]);

  return <div ref={chartRef} className="w-full h-[350px]" />;
}
