
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

    const bestBid = bids.length ? bids[0].price : null;
    const bestAsk = asks.length ? asks[0].price : null;

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

    const chart = chartRef.current;

    const bidData = (bids || []).map((p) => ({
      time: p.price,
      value: p.size,
    }));
    const askData = (asks || []).map((p) => ({
      time: p.price,
      value: p.size,
    }));

    chart.bidSeries.setData(bidData);
    chart.askSeries.setData(askData);

    const wallBids = bids.filter((b: any) => b.isWall);
    const wallAsks = asks.filter((a: any) => a.isWall);

    // Remove old wall markers
    document.querySelectorAll('.depth-wall').forEach(e => e.remove());

    function createWallMarker(price: number, color: string) {
        const chart = chartRef.current;
        const el = containerRef.current;
        if (!el || !chart) return;
        const x = chart.timeScale().timeToCoordinate(price);
        if (!x) return;

        const div = document.createElement('div');
        div.className = 'depth-wall';
        div.style.position = 'absolute';
        div.style.left = `${x - 2}px`;
        div.style.top = '0px';
        div.style.bottom = '0px';
        div.style.width = '4px';
        div.style.background = color;
        div.style.opacity = '0.4';
        div.style.boxShadow = `0 0 12px ${color}`;
        div.style.pointerEvents = 'none'; // Ensure it doesn't interfere with chart events
        el.appendChild(div);
    }

    wallBids.forEach((w: any) => createWallMarker(w.price, 'rgba(0,255,140,0.7)'));
    wallAsks.forEach((w: any) => createWallMarker(w.price, 'rgba(255,100,100,0.7)'));


  }, [bids, asks]);

  // ------------------------------------------
  // 3. Mid Price Line Overlay (HTML Layer)
  // ------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !midPrice || !chartRef.current) return;

    const chart = chartRef.current;

    const oldLine = document.getElementById('mid-price-line');
    const oldLabel = document.getElementById('mid-price-label');
    if (oldLine) oldLine.remove();
    if (oldLabel) oldLabel.remove();

    const pixelX = chart.timeScale().timeToCoordinate(midPrice);
    if (!pixelX) return;

    const line = document.createElement('div');
    line.id = 'mid-price-line';
    line.style.position = 'absolute';
    line.style.left = `${pixelX}px`;
    line.style.top = '0';
    line.style.bottom = '0';
    line.style.width = '1px';
    line.style.background = 'rgba(200,200,200,0.35)';
    line.style.pointerEvents = 'none';

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
        const price = chart.timeScale().coordinateToTime(param.point.x);
        if (!price) return;
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
