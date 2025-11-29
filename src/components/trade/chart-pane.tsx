
"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, CrosshairMode } from "lightweight-charts";
import { useMultiChart } from "./multi-chart-provider";

export function ChartPane({ symbolOverride }: { symbolOverride?: string }) {
  const { globalSymbol, globalInterval } = useMultiChart();
  const symbol = symbolOverride || globalSymbol;

  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chartInstance = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { background: { color: "transparent" }, textColor: "#aaa" },
      grid: {
        vertLines: { color: "#222" },
        horzLines: { color: "#222" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        borderColor: '#333',
      },
      rightPriceScale: {
        borderColor: '#333',
      },
    });

    const candleSeries = chartInstance.addCandlestickSeries({
      wickUpColor: '#26a69a',
      upColor: '#26a69a',
      wickDownColor: '#ef5350',
      downColor: '#ef5350',
      borderVisible: false,
    });

    setChart(chartInstance);
    setSeries(candleSeries);

    const handleResize = () => {
      chartInstance.applyOptions({ width: containerRef.current!.clientWidth, height: containerRef.current!.clientHeight });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (!symbol || !series) return;

    async function fetchData() {
      if (!symbol) return;
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.replace("-", "")}&interval=${globalInterval}&limit=500`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch klines for ${symbol}`);
        const json = await res.json();

        const data = json.map((c: any) => ({
          time: c[0] / 1000,
          open: parseFloat(c[1]),
          high: parseFloat(c[2]),
          low: parseFloat(c[3]),
          close: parseFloat(c[4]),
        }));

        if (series) {
          series.setData(data);
        }
      } catch (error) {
        console.error("ChartPane fetch data error:", error);
      }
    }

    fetchData();
  }, [symbol, series, globalInterval]);

  return (
    <div ref={containerRef} className="w-full h-full relative border border-neutral-800" />
  );
}
