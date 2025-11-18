'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
  LineStyle,
} from 'lightweight-charts';
import { TimeframeToolbar } from './timeframe-toolbar';

interface Candle {
  time: number;
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
          time: c[0] / 1000,
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

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Tooltip logic
    if (tooltipRef.current) {
      const tooltip = tooltipRef.current;
      chart.subscribeCrosshairMove((param) => {
        // Safely extract price from all possible formats (Map, object, undefined)
        const seriesPrices = param.seriesPrices;
        const priceData = seriesPrices && typeof seriesPrices.get === 'function' ? seriesPrices.get(seriesRef.current!) : null;

        if (!param.time || !priceData) {
            tooltip.style.display = 'none';
            return;
        }

        const { open, high, low, close } = priceData as any;
        const date = new Date(param.time * 1000).toLocaleString();

        tooltip.style.display = 'block';
        tooltip.innerHTML = `
            <div style="font-size: 14px; margin-bottom: 4px;">${date}</div>
            <div><strong>O:</strong> ${open.toFixed(2)}</div>
            <div><strong>H:</strong> ${high.toFixed(2)}</div>
            <div><strong>L:</strong> ${low.toFixed(2)}</div>
            <div><strong>C:</strong> ${close.toFixed(2)}</div>
        `;
        
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

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    }
  }, []);

  // Update chart whenever klineData changes
  useEffect(() => {
    if (!seriesRef.current || klineData.length === 0) return;
    seriesRef.current.setData(klineData);
    chartRef.current?.timeScale().fitContent();
  }, [klineData]);

  return (
    <div className="h-full w-full flex flex-col">
        <TimeframeToolbar selected={interval} onChange={setInterval} />
        <div className="relative h-full w-full flex-grow">
            <div ref={containerRef} className="absolute inset-0" />
            <div
                ref={tooltipRef}
                className="absolute pointer-events-none text-xs text-white bg-black/70 px-2 py-1 rounded shadow-lg"
                style={{ display: "none", zIndex: 40 }}
            />
        </div>
    </div>
  );
}
