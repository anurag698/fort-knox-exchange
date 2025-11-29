'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
  LineStyle,
  Time,
} from 'lightweight-charts';
import { TimeframeToolbar } from './timeframe-toolbar';
import Portal from '../ui/portal';

interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function LightweightChart({ marketId }: { marketId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [klineData, setKlineData] = useState<Candle[]>([]);
  const [interval, setInterval] = useState('1m');

  // Fetch Kline data when market or interval changes
  useEffect(() => {
    async function fetchData() {
      if (!marketId) return;
      try {
        const symbol = marketId.replace('-', '');
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch klines for ${symbol}`);
        const json = await res.json();

        const data = json.map((c: any) => ({
          time: (c[0] / 1000) as Time,
          open: parseFloat(c[1]),
          high: parseFloat(c[2]),
          low: parseFloat(c[3]),
          close: parseFloat(c[4]),
        }));
        setKlineData(data);
      } catch (error) {
        console.error("Kline data fetch error:", error);
        setKlineData([]); // Clear data on error
      }
    }
    fetchData();
  }, [marketId, interval]);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 400, // This will be overridden by the container's height
      layout: { background: { color: 'transparent' }, textColor: '#ccc' },
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

    // Throttled ResizeObserver
    let resizeRAF: number | null = null;
    const ro = new ResizeObserver(() => {
      if (containerRef.current && !resizeRAF) {
        resizeRAF = requestAnimationFrame(() => {
          if (chartRef.current && containerRef.current) {
            chartRef.current.applyOptions({
              width: containerRef.current.clientWidth,
              height: containerRef.current.clientHeight,
            });
          }
          resizeRAF = null;
        });
      }
    });
    ro.observe(containerRef.current);

    chart.subscribeCrosshairMove((param) => {
      const tooltip = tooltipRef.current;

      // Extract price safely from any format
      let priceData = null;

      if ((param as any).seriesPrices && typeof (param as any).seriesPrices === 'object') {
        const values = Object.values((param as any).seriesPrices);
        priceData = values && values.length > 0 ? values[0] : null;
      }

      // If no data → hide tooltip
      if (!param.time || !priceData || !seriesRef.current || !param.point) {
        if (tooltip) tooltip.style.display = 'none';
        return;
      }

      // Normalize price depending on library version
      const price =
        typeof priceData === 'object' && 'value' in priceData
          ? priceData.value
          : priceData;

      const { open, high, low, close } = priceData as any;
      const date = new Date((param.time as number) * 1000).toLocaleString();
      const tooltipText = `
          <div style="font-size: 14px; margin-bottom: 4px;">${date}</div>
          <div><strong>O:</strong> ${open.toFixed(2)}</div>
          <div><strong>H:</strong> ${high.toFixed(2)}</div>
          <div><strong>L:</strong> ${low.toFixed(2)}</div>
          <div><strong>C:</strong> ${close.toFixed(2)}</div>
      `;

      // Show tooltip
      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.innerHTML = tooltipText;

        const chartWidth = containerRef.current!.clientWidth;
        const chartHeight = containerRef.current!.clientHeight;
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        let left = param.point.x + 15;
        if (left + tooltipWidth > chartWidth) {
          left = param.point.x - tooltipWidth - 15;
        }

        let top = param.point.y + 15;
        if (top + tooltipHeight > chartHeight) {
          top = param.point.y - tooltipHeight - 15;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      }
    });

    return () => {
      ro.disconnect();
      chart.remove();
    }
  }, []);

  // Update chart whenever klineData changes
  useEffect(() => {
    if (!seriesRef.current || klineData.length === 0) return;
    seriesRef.current.setData(klineData);
    chartRef.current?.timeScale().fitContent();
  }, [klineData]);

  // Real-time updates via WebSocket would go here, using queueKlineUpdate
  // For now, it relies on the periodic refetch from the top-level useEffect.

  return (
    <div className="h-full w-full flex flex-col">
      <Portal>
        <div className="absolute top-0 left-0 z-10 pointer-events-auto">
          <TimeframeToolbar selected={interval} onChange={setInterval} />
        </div>
      </Portal>
      <div className="relative h-full w-full flex-grow">
        <div ref={containerRef} className="absolute inset-0" />
        <Portal>
          <div
            ref={tooltipRef}
            className="absolute pointer-events-none text-xs text-white bg-black/70 px-2 py-1 rounded shadow-lg"
            style={{ display: "none", zIndex: 40 }}
          />
        </Portal>
      </div>
    </div>
  );
}
