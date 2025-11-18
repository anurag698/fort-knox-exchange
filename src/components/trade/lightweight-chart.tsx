
'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineStyle,
} from 'lightweight-charts';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function LightweightChart({ klineData }: { klineData: Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      height: 400,
      layout: { background: { color: '#0d1117' }, textColor: '#ccc' },
      grid: {
        vertLines: { color: '#222' },
        horzLines: { color: '#222' },
      },
      rightPriceScale: { borderColor: '#333' },
      timeScale: { borderColor: '#333' },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries({
      wickUpColor: '#26a69a',
      upColor: '#26a69a',
      wickDownColor: '#ef5350',
      downColor: '#ef5350',
      borderVisible: false,
    });

    return () => chartRef.current?.remove();
  }, []);

  // Update chart whenever klineData changes
  useEffect(() => {
    if (!seriesRef.current || klineData.length === 0) return;

    seriesRef.current.setData(klineData);

    // keep the chart focused on the last candles
    chartRef.current?.timeScale().fitContent();
  }, [klineData]);

  return <div ref={containerRef} className="w-full" />;
}
