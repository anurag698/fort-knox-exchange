
"use client";

import { createChart, type ChartOptions, type DeepPartial, type IChartApi, type ISeriesApi, type SeriesOptionsMap, type CandlestickData, type Time } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

interface LightweightChartProps {
  options?: DeepPartial<ChartOptions>;
  candlestickSeriesOptions?: DeepPartial<SeriesOptionsMap['Candlestick']>;
  initialData: CandlestickData<Time>[];
  onChartReady: (chart: IChartApi, series: ISeriesApi<'Candlestick'>) => void;
  height?: number;
}

export const LightweightChart: React.FC<LightweightChartProps> = ({
  options,
  candlestickSeriesOptions,
  initialData,
  onChartReady,
  height = 400
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      ...options,
      width: chartContainerRef.current.clientWidth,
      height: height,
    });
    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries(candlestickSeriesOptions);
    candlestickSeries.setData(initialData);

    onChartReady(chart, candlestickSeries);

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, options, candlestickSeriesOptions, height]);

  return <div ref={chartContainerRef} />;
};
