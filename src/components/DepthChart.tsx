'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  AreaSeriesPartialOptions,
  Time,
} from 'lightweight-charts';

interface DepthPoint {
  price: number;
  volume: number;
}

interface Props {
  bids: DepthPoint[];
  asks: DepthPoint[];
}

export default function DepthChart({ bids, asks }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const bidSeriesRef = useRef<any>(null);
  const askSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 340,
      layout: { background: { color: '#0d1117' }, textColor: '#ccc' },
      grid: {
        vertLines: { color: '#222' },
        horzLines: { color: '#222' },
      },
      rightPriceScale: { borderColor: '#333' },
      timeScale: { visible: false },
    });

    bidSeriesRef.current = chartRef.current.addAreaSeries({
      topColor: 'rgba(0, 255, 0, 0.6)',
      bottomColor: 'rgba(0, 255, 0, 0.1)',
      lineColor: 'rgba(0, 255, 0, 0.8)',
      lineWidth: 2,
    });

    askSeriesRef.current = chartRef.current.addAreaSeries({
      topColor: 'rgba(255, 0, 0, 0.6)',
      bottomColor: 'rgba(255, 0, 0, 0.1)',
      lineColor: 'rgba(255, 0, 0, 0.8)',
      lineWidth: 2,
    });

    return () => {
      chartRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!bidSeriesRef.current || !askSeriesRef.current) return;

    // convert depth to cumulative
    const cumulativeBids = [];
    const cumulativeAsks = [];

    let total = 0;
    for (const b of bids) {
      total += b.volume;
      cumulativeBids.push({ value: total, time: b.price });
    }

    total = 0;
    for (const a of asks) {
      total += a.volume;
      cumulativeAsks.push({ value: total, time: a.price });
    }

    bidSeriesRef.current.setData(cumulativeBids);
    askSeriesRef.current.setData(cumulativeAsks);
  }, [bids, asks]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#0d1117] border border-gray-800 rounded"
    ></div>
  );
}
