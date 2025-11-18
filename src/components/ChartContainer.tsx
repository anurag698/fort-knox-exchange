'use client';

import { useRef, useEffect } from 'react';
import {
  createChart,
  IChartApi,
  Time,
  BarData,
  UTCTimestamp,
} from 'lightweight-charts';

interface Props {
  data: BarData[];
}

export default function ChartContainer({ data }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<any>(null);

  useEffect(() => {
    if (!container.current) return;

    chart.current = createChart(container.current, {
      width: container.current.clientWidth,
      height: 350,
      layout: { background: { color: '#0d1117' }, textColor: '#ccc' },
      grid: {
        vertLines: { color: '#222' },
        horzLines: { color: '#222' },
      },
      timeScale: { borderColor: '#333' },
      rightPriceScale: { borderColor: '#333' },
    });

    series.current = chart.current.addCandlestickSeries();

    if (data?.length) {
      series.current.setData(data);
    }

    return () => {
      chart.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (series.current && data?.length) {
      series.current.setData(data);
    }
  }, [data]);

  return (
    <div className="w-full bg-[#0d1117] border border-gray-800 rounded" ref={container}></div>
  );
}
