// This component renders a visual representation of the market depth chart.
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import type { RawOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type CumulativePoint = { price: number; cumulative: number };
type DepthChartProps = {
  bids: RawOrder[];
  asks: RawOrder[];
};

const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

function buildCumulative(bids: RawOrder[], asks: RawOrder[]): { bidPoints: CumulativePoint[]; askPoints: CumulativePoint[] } {
  const ascBids = [...bids].map(([price, amount]) => ({ price: parseFloat(price), amount: parseFloat(amount) })).sort((a, b) => a.price - b.price);
  let bidCum = 0;
  const bidPoints = ascBids.map(b => { bidCum += b.amount; return { price: b.price, cumulative: bidCum }; });

  const ascAsks = [...asks].map(([price, amount]) => ({ price: parseFloat(price), amount: parseFloat(amount) })).sort((a, b) => a.price - b.price);
  let askCum = 0;
  const askPoints = ascAsks.map(a => { askCum += a.amount; return { price: a.price, cumulative: askCum }; });

  return { bidPoints, askPoints };
}

export function DepthChart({ bids, asks }: DepthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const { bidPoints, askPoints } = useMemo(() => buildCumulative(bids, asks), [bids, asks]);
  const priceMin = useMemo(() => Math.min(bidPoints[0]?.price ?? Infinity, askPoints[0]?.price ?? Infinity), [bidPoints, askPoints]);
  const priceMax = useMemo(() => Math.max(bidPoints[bidPoints.length - 1]?.price ?? 0, askPoints[askPoints.length - 1]?.price ?? 0), [bidPoints, askPoints]);
  const maxCumulative = useMemo(() => Math.max(bidPoints[bidPoints.length - 1]?.cumulative ?? 0, askPoints[askPoints.length - 1]?.cumulative ?? 0, 1), [bidPoints, askPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = wrapper.getBoundingClientRect();
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(DPR, DPR);
      draw(ctx, width, height);
    });
    resizeObserver.observe(wrapper);

    const draw = (context: CanvasRenderingContext2D, w: number, h: number) => {
      context.clearRect(0, 0, w, h);
      const drawSurface = (points: CumulativePoint[], color: string) => {
        if (points.length === 0) return;
        const priceToX = (price: number) => Math.max(0, Math.min(w, ((price - priceMin) / (priceMax - priceMin)) * w));
        const cumulativeToY = (cum: number) => h - (cum / maxCumulative) * h;
        
        context.beginPath();
        context.moveTo(priceToX(points[0].price), h);
        points.forEach(p => context.lineTo(priceToX(p.price), cumulativeToY(p.cumulative)));
        context.lineTo(priceToX(points[points.length - 1].price), h);
        context.closePath();

        const grad = context.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, `${color}B3`);
        grad.addColorStop(0.8, `${color}33`);
        grad.addColorStop(1, `${color}00`);
        context.fillStyle = grad;
        context.fill();

        context.beginPath();
        context.moveTo(priceToX(points[0].price), cumulativeToY(points[0].cumulative));
        points.forEach(p => context.lineTo(priceToX(p.price), cumulativeToY(p.cumulative)));
        context.lineWidth = 1.5;
        context.strokeStyle = color;
        context.stroke();
      };
      
      drawSurface(askPoints, '#ef4444');
      drawSurface(bidPoints, '#16a34a');
    };
    
    render();
    function render() {
      const { width, height } = wrapper.getBoundingClientRect();
      draw(ctx!, width, height);
      animationFrameId = requestAnimationFrame(render);
    }

    return () => { resizeObserver.disconnect(); cancelAnimationFrame(animationFrameId); };
  }, [bidPoints, askPoints, priceMin, priceMax, maxCumulative]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4"><CardTitle className="text-lg">Market Depth</CardTitle></CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div ref={wrapperRef} className="h-full w-full"><canvas ref={canvasRef} /></div>
      </CardContent>
    </Card>
  );
}
