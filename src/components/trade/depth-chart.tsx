'use client';

import { createChart, ColorType } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { useMarketDataStore } from '@/lib/market-data-service';

export default function DepthChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const bids = useMarketDataStore((s) => s.depth.bids);
  const asks = useMarketDataStore((s) => s.depth.asks);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0e0e0e' },
          textColor: '#ccc',
        },
        grid: {
          vertLines: { color: '#1a1a1a' },
          horzLines: { color: '#1a1a1a' },
        },
        height: 300,
        rightPriceScale: {
          visible: false,
        },
        timeScale: {
          borderVisible: false,
        }
      });

      chartRef.current.bidSeries = chartRef.current.addAreaSeries({
        lineColor: '#00b15d',
        topColor: 'rgba(0, 225, 115, 0.35)',
        bottomColor: 'rgba(0, 225, 115, 0.00)',
        lineWidth: 2,
        priceScaleId: 'left',
      });

      chartRef.current.askSeries = chartRef.current.addAreaSeries({
        lineColor: '#d93f3f',
        topColor: 'rgba(255, 82, 82, 0.35)',
        bottomColor: 'rgba(255, 82, 82, 0.00)',
        lineWidth: 2,
        priceScaleId: 'left',
      });
    }

    const chart = chartRef.current;

    // Process bids (descending for cumulative volume)
    let cumulativeBidVolume = 0;
    const bidData = (bids || [])
      .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
      .map(([p, q]) => {
        cumulativeBidVolume += parseFloat(q);
        return { time: parseFloat(p), value: cumulativeBidVolume };
      });
      
    // Process asks (ascending for cumulative volume)
    let cumulativeAskVolume = 0;
    const askData = (asks || [])
       .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([p, q]) => {
        cumulativeAskVolume += parseFloat(q);
        return { time: parseFloat(p), value: cumulativeAskVolume };
      });

    chart.bidSeries.setData(bidData);
    chart.askSeries.setData(askData);
    
    if (bidData.length > 0 && askData.length > 0) {
      chart.timeScale().setVisibleRange({
        from: bidData[bidData.length - 1].time,
        to: askData[askData.length - 1].time,
      });
    }

  }, [bids, asks]);

  return <div ref={containerRef} className="w-full h-[300px]" />;
}
