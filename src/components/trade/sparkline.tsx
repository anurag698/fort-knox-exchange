'use client';

import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export function Sparkline({ data }: { data: number[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data || data.length === 0) return;

    const chart = createChart(ref.current, {
      width: 100,
      height: 28,
      layout: { background: { color: 'transparent' } },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addLineSeries({
      color: data[data.length - 1] >= data[0] ? '#22c55e' : '#ef4444',
      lineWidth: 2,
    });

    const points = data.map((v, i) => ({
      time: i + 1,
      value: v,
    }));

    series.setData(points as any);

    return () => chart.remove();
  }, [data]);

  return <div ref={ref} className="w-[100px] h-[28px]" />;
}
