'use client';

import React, { useEffect, useRef } from 'react';
import {
  init,
  type Chart,
  type DeepPartial,
  type AreaSeriesPartialOptions,
} from 'klinecharts';
import { useMarketDataStore } from '@/lib/market-data-service';
import type { RawOrder } from '@/lib/types';

/* Types */
interface CumulativePoint {
  price: number;
  cumulative: number;
}

interface DepthChartProps {
  marketId: string;
}

/* Build cumulative depth */
function buildCumulative(
  bids: RawOrder[],
  asks: RawOrder[]
): { bidPoints: CumulativePoint[]; askPoints: CumulativePoint[] } {
  if (!Array.isArray(bids) || !Array.isArray(asks)) {
    return { bidPoints: [], askPoints: [] };
  }

  const ascBids = [...bids]
    .map(([price, amount]) => ({
      price: parseFloat(price),
      amount: parseFloat(amount),
    }))
    .sort((a, b) => a.price - b.price);

  const descAsks = [...asks]
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

  let askCum = 0;
  const askPoints = descAsks.map((a) => {
    askCum += a.amount;
    return { price: a.price, cumulative: askCum };
  });

  return { bidPoints, askPoints };
}

export default function DepthChart({ marketId }: DepthChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const bids = useMarketDataStore((s) => s.depth.bids);
  const asks = useMarketDataStore((s) => s.depth.asks);

  const { bidPoints, askPoints } = buildCumulative(bids, asks);

  /* Init chart */
  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = init(containerRef.current, {
        layout: {
          backgroundColor: '#0e0e0e',
          textColor: '#ccc',
        },
        grid: {
          horizontal: { color: '#1a1a1a' },
          vertical: { color: '#1a1a1a' },
        },
      });
    }

    const chart = chartRef.current;
    chart.clearData();

    // --- BID SERIES (GREEN) ---
    chart.createPane({
        id: 'bidPane',
        // @ts-expect-error - klinecharts types might be slightly off
        series: [
             {
                type: 'Area',
                data: bidPoints.map((p) => ({ value: p.cumulative, timestamp: p.price })),
                styles: {
                    line: {
                        color: '#00b15d',
                        size: 2,
                    },
                    area: {
                        topColor: 'rgba(0, 225, 115, 0.35)',
                        bottomColor: 'rgba(0, 225, 115, 0.00)',
                    }
                }
            }
        ]
    });
    
    // --- ASK SERIES (RED) ---
     chart.createPane({
        id: 'askPane',
        // @ts-expect-error - klinecharts types might be slightly off
        series: [
            {
                type: 'Area',
                data: askPoints.map((p) => ({ value: p.cumulative, timestamp: p.price })),
                styles: {
                    line: {
                        color: '#d93f3f',
                        size: 2,
                    },
                    area: {
                        topColor: 'rgba(255, 82, 82, 0.35)',
                        bottomColor: 'rgba(255, 82, 82, 0.00)',
                    }
                }
            }
        ]
    });


    chart.setPriceVolumePrecision(2, 2);
    chart.adjustPaneViewport(false, 'bidPane', true, true);
    chart.adjustPaneViewport(false, 'askPane', true, true);

  }, [bidPoints, askPoints]);

  return (
    <div className="w-full h-[300px] relative rounded-lg overflow-hidden bg-[#0d0d0d]">
      <div
        ref={containerRef}
        className="absolute inset-0"
      />
    </div>
  );
}
