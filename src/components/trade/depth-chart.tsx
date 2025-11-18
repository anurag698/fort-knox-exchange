
'use client';

import { useMemo } from 'react';
import { createChart } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

type RawOrder = [string, string];

interface CumulativePoint {
  price: number;
  cumulative: number;
}

interface Props {
  bids?: RawOrder[];
  asks?: RawOrder[];
}

function buildCumulative(
  bids: RawOrder[] = [],
  asks: RawOrder[] = []
): { bidPoints: CumulativePoint[]; askPoints: CumulativePoint[] } {
  if (!Array.isArray(bids)) bids = [];
  if (!Array.isArray(asks)) asks = [];

  const ascBids = [...bids]
    .map(([price, amount]) => ({
      price: parseFloat(price),
      amount: parseFloat(amount),
    }))
    .sort((a, b) => a.price - b.price);

  let bidCum = 0;
  const bidPoints = ascBids.map((b) => {
    bidCum += b.amount;
    return { price: b.price, cumulative: bidCum };
  });

  const ascAsks = [...asks]
    .map(([price, amount]) => ({
      price: parseFloat(price),
      amount: parseFloat(amount),
    }))
    .sort((a, b) => a.price - b.price);

  let askCum = 0;
  const askPoints = ascAsks.map((a) => {
    askCum += a.amount;
    return { price: a.price, cumulative: askCum };
  });

  return { bidPoints, askPoints };
}

export default function DepthChart({ bids = [], asks = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const bidSeriesRef = useRef<any>(null);
  const askSeriesRef = useRef<any>(null);

  const { bidPoints, askPoints } = useMemo(() => {
    return buildCumulative(bids, asks);
  }, [bids, asks]);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 350,
      layout: { background: { color: '#05070a' }, textColor: '#ccc' },
      grid: {
        vertLines: { color: '#222' },
        horzLines: { color: '#222' },
      },
      timeScale: { visible: false },
      rightPriceScale: { visible: false },
    });

    bidSeriesRef.current = chartRef.current.addAreaSeries({
      topColor: 'rgba(0,255,0,0.5)',
      bottomColor: 'rgba(0,255,0,0.1)',
      lineColor: 'rgba(0,255,0,0.8)',
      lineWidth: 2,
    });

    askSeriesRef.current = chartRef.current.addAreaSeries({
      topColor: 'rgba(255,0,0,0.5)',
      bottomColor: 'rgba(255,0,0,0.1)',
      lineColor: 'rgba(255,0,0,0.8)',
      lineWidth: 2,
    });

    return () => chartRef.current?.remove();
  }, []);

  useEffect(() => {
    if (!bidSeriesRef.current || !askSeriesRef.current) return;

    bidSeriesRef.current.setData(bidPoints);
    askSeriesRef.current.setData(askPoints);
  }, [bidPoints, askPoints]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#0d1117] border border-gray-800 rounded"
    ></div>
  );
}
