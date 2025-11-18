'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
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
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 400,
      layout: { background: { color: '#0d1117' }, textColor: '#ccc' },
      grid: {
        vertLines: { color: '#222' },
        horzLines: { color: '#222' },
      },
      rightPriceScale: { borderColor: '#333' },
      timeScale: { borderColor: '#333', timeVisible: true, secondsVisible: false },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: '#555', style: LineStyle.Dashed },
        horzLine: { width: 1, color: '#555', style: LineStyle.Dashed },
      },
    });
    chartRef.current = chart;

    seriesRef.current = chart.addCandlestickSeries({
      wickUpColor: '#26a69a',
      upColor: '#26a69a',
      wickDownColor: '#ef5350',
      downColor: '#ef5350',
      borderVisible: false,
    });

    // Tooltip logic
    if(tooltipRef.current) {
        const tooltip = tooltipRef.current;
        chart.subscribeCrosshairMove((param) => {
            if (!param.time || !param.seriesPrices.size || !seriesRef.current) {
                tooltip.style.display = 'none';
                return;
            }
            const data = param.seriesPrices.get(seriesRef.current);
            if(!data) {
                 tooltip.style.display = 'none';
                return;
            }

            const { open, high, low, close } = data as any;
            const date = new Date(param.time * 1000).toLocaleString();

            tooltip.style.display = 'block';
            tooltip.innerHTML = `
                <div style="font-size: 14px; margin-bottom: 4px;">${date}</div>
                <div><strong>O:</strong> ${open.toFixed(2)}</div>
                <div><strong>H:</strong> ${high.toFixed(2)}</div>
                <div><strong>L:</strong> ${low.toFixed(2)}</div>
                <div><strong>C:</strong> ${close.toFixed(2)}</div>
            `;
            
            // Position tooltip
            const chartWidth = containerRef.current!.clientWidth;
            const chartHeight = containerRef.current!.clientHeight;
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;

            let left = param.point!.x + 15;
            if (left + tooltipWidth > chartWidth) {
                left = param.point!.x - tooltipWidth - 15;
            }

            let top = param.point!.y + 15;
            if (top + tooltipHeight > chartHeight) {
                top = param.point!.y - tooltipHeight - 15;
            }
            
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        });
    }


    return () => chart.remove();
  }, []);

  // Update chart whenever klineData changes
  useEffect(() => {
    if (!seriesRef.current || klineData.length === 0) return;

    seriesRef.current.setData(klineData);

    // keep the chart focused on the last candles
    chartRef.current?.timeScale().fitContent();
  }, [klineData]);

  return (
    <div className="relative h-full w-full">
        <div ref={containerRef} className="absolute inset-0" />
        <div
            ref={tooltipRef}
            className="absolute pointer-events-none text-xs text-white bg-black/70 px-2 py-1 rounded shadow-lg"
            style={{ display: "none", zIndex: 40 }}
        />
    </div>
  );
}
