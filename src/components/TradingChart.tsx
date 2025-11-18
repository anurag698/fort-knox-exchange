
"use client";

import { useEffect, useRef } from "react";
import { marketDataService } from "../lib/market-data-service";
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
    const streamName = `${symbol}@kline_1m`;
    const subscription = marketDataService.subscribe(streamName, (klineData: any) => {
        const kline = klineData.k;
        series.update({
            time: Math.floor(kline.t / 1000) as any,
            open: kline.o,
            high: kline.h,
            low: kline.l,
            close: kline.c,
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
      if (subscription) {
          subscription.close();
      }
      chart.remove();
    };
  }, [symbol]);

  return <div ref={chartRef} className="w-full h-[350px]" />;
}
