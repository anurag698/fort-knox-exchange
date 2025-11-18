'use client';

import { createChart, ColorType } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';
import { useMarketDataStore } from '@/lib/market-data-service';

export default function DepthChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const bids = useMarketDataStore((s) => s.bids);
  const asks = useMarketDataStore((s) => s.asks);
  const ticker = useMarketDataStore((s) => s.ticker);

  const [midPrice, setMidPrice] = useState<number | null>(null);

  // ------------------------------------------
  // 1. Mid Price Calculation
  // ------------------------------------------
  useEffect(() => {
    if (!bids || !asks) return;

    const bestBid = bids.length ? parseFloat(bids[0][0]) : null;
    const bestAsk = asks.length ? parseFloat(asks[0][0]) : null;

    let derived = null;

    if (ticker?.c) {
      derived = parseFloat(ticker.c);
    } else if (bestBid && bestAsk) {
      derived = (bestBid + bestAsk) / 2;
    }

    setMidPrice(derived || null);
  }, [bids, asks, ticker]);

  // ------------------------------------------
  // 2. Chart Initialization
  // ------------------------------------------
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
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
      });

      chartRef.current.bidSeries = chartRef.current.addAreaSeries({
        lineColor: '#00b15d',
        topColor: 'rgba(0, 225, 115, 0.35)',
        bottomColor: 'rgba(0, 225, 115, 0.00)',
        lineWidth: 2,
      });

      chartRef.current.askSeries = chartRef.current.addAreaSeries({
        lineColor: '#d93f3f',
        topColor: 'rgba(255, 82, 82, 0.35)',
        bottomColor: 'rgba(255, 82, 82, 0.00)',
        lineWidth: 2,
      });
    }

    // Map orderbook to chart points
    const bidData = (bids || []).map(([p, q]) => ({
      time: parseFloat(p),
      value: q,
    }));
    const askData = (asks || []).map(([p, q]) => ({
      time: parseFloat(p),
      value: q,
    }));

    chartRef.current.bidSeries.setData(bidData);
    chartRef.current.askSeries.setData(askData);

  }, [bids, asks]);

  // ------------------------------------------
  // 3. Mid Price Line Overlay (HTML Layer)
  // ------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !midPrice || !chartRef.current) return;

    const chart = chartRef.current;

    // Remove old line
    const oldLine = document.getElementById('mid-price-line');
    const oldLabel = document.getElementById('mid-price-label');
    if (oldLine) oldLine.remove();
    if (oldLabel) oldLabel.remove();

    // Convert price → pixel position
    const pixelX = chart.timeScale().timeToCoordinate(midPrice);

    if (!pixelX) return;

    // Create vertical line element
    const line = document.createElement('div');
    line.id = 'mid-price-line';
    line.style.position = 'absolute';
    line.style.left = `${pixelX}px`;
    line.style.top = '0';
    line.style.bottom = '0';
    line.style.width = '1px';
    line.style.background = 'rgba(200,200,200,0.35)';
    line.style.pointerEvents = 'none';

    // Create label element
    const label = document.createElement('div');
    label.id = 'mid-price-label';
    label.innerText = midPrice.toFixed(2);
    label.style.position = 'absolute';
    label.style.left = `${pixelX - 30}px`;
    label.style.top = '10px';
    label.style.padding = '2px 6px';
    label.style.background = '#1a1a1a';
    label.style.border = '1px solid #333';
    label.style.borderRadius = '4px';
    label.style.fontSize = '11px';
    label.style.color = '#fff';
    label.style.pointerEvents = 'none';

    el.appendChild(line);
    el.appendChild(label);

  }, [midPrice, containerRef.current]);

  // ------------------------------------------
  // 4. Hover Sync: Detect hovered price
  // ------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chartRef.current) return;

    const chart = chartRef.current;

    function handleMove(param: any) {
        if (!param.point) return;

        // Convert pixel → price  
        const price = chart.timeScale().coordinateToTime(param.point.x);
        if (!price) return;

        // Save hovered price globally
        useMarketDataStore.getState().setHoveredPrice(price);
    }

    chart.subscribeCrosshairMove(handleMove);

    return () => chart.unsubscribeCrosshairMove(handleMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[300px] rounded-lg overflow-hidden bg-[#0d0d0d]"
    />
  );
}
