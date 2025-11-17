
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import type { RawOrder } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type CumulativePoint = { price: number; cumulative: number };
type DepthChartProps = {
  bids: RawOrder[]; // [price, quantity]
  asks: RawOrder[]; // [price, quantity]
};

const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

/**
 * Convert bids/asks into cumulative arrays of points suitable for plotting.
 * Returns arrays of { price, cumulative } sorted ascending by price.
 */
function buildCumulative(
  bids: RawOrder[],
  asks: RawOrder[]
): { bidPoints: CumulativePoint[]; askPoints: CumulativePoint[] } {
  // Bids: descending input -> convert to ascending by price
  const ascBids = [...bids]
    .map(([price, amount]) => ({
      price: parseFloat(price),
      amount: parseFloat(amount),
    }))
    .sort((a, b) => a.price - b.price);

  let bidCum = 0;
  const bidPoints = ascBids.map(b => {
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
  const askPoints = ascAsks.map(a => {
    askCum += a.amount;
    return { price: a.price, cumulative: askCum };
  });

  return { bidPoints, askPoints };
}

export function DepthChart({ bids, asks }: DepthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const { bidPoints, askPoints } = useMemo(
    () => buildCumulative(bids, asks),
    [bids, asks]
  );

  const priceMin = useMemo(() => {
    const bmin = bidPoints.length
      ? bidPoints[0].price
      : Number.POSITIVE_INFINITY;
    const amin = askPoints.length
      ? askPoints[0].price
      : Number.POSITIVE_INFINITY;
    return Math.min(bmin, amin === Number.POSITIVE_INFINITY ? bmin : amin);
  }, [bidPoints, askPoints]);

  const priceMax = useMemo(() => {
    const bmax = bidPoints.length ? bidPoints[bidPoints.length - 1].price : 0;
    const amax = askPoints.length ? askPoints[askPoints.length - 1].price : 0;
    return Math.max(bmax, amax);
  }, [bidPoints, askPoints]);

  const maxCumulative = useMemo(() => {
    const bmax = bidPoints.length
      ? bidPoints[bidPoints.length - 1].cumulative
      : 0;
    const amax = askPoints.length
      ? askPoints[askPoints.length - 1].cumulative
      : 0;
    return Math.max(bmax, amax, 1);
  }, [bidPoints, askPoints]);

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

    const draw = (
      context: CanvasRenderingContext2D,
      w: number,
      h: number
    ) => {
      context.clearRect(0, 0, w, h);

      const drawSurface = (
        points: CumulativePoint[],
        color: string,
        gradientAlpha = 0.6
      ) => {
        if (points.length === 0) return;

        const priceToX = (price: number) => {
          if (priceMax === priceMin) return w / 2;
          return Math.max(0, Math.min(w, ((price - priceMin) / (priceMax - priceMin)) * w));
        };
        const cumulativeToY = (cum: number) => h - (cum / maxCumulative) * h;
        
        context.beginPath();
        context.moveTo(priceToX(points[0].price), h);
        for (const p of points) {
          context.lineTo(priceToX(p.price), cumulativeToY(p.cumulative));
        }
        context.lineTo(priceToX(points[points.length - 1].price), h);
        context.closePath();

        const grad = context.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, `${color}${Math.floor(255 * gradientAlpha).toString(16).padStart(2, '0')}`);
        grad.addColorStop(0.8, `${color}20`);
        grad.addColorStop(1, `${color}00`);
        context.fillStyle = grad;
        context.fill();

        context.beginPath();
        context.moveTo(priceToX(points[0].price), cumulativeToY(points[0].cumulative));
        for (const p of points) {
          context.lineTo(priceToX(p.price), cumulativeToY(p.cumulative));
        }
        context.lineWidth = 1.5;
        context.strokeStyle = color;
        context.stroke();
      };
      
      drawSurface(askPoints, '#ef4444', 0.7);
      drawSurface(bidPoints, '#16a34a', 0.7);
    };

    const render = () => {
      const { width, height } = wrapper.getBoundingClientRect();
      draw(ctx, width, height);
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [bidPoints, askPoints, priceMin, priceMax, maxCumulative]);

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Market Depth</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div ref={wrapperRef} className="h-48 w-full">
          <canvas ref={canvasRef} />
        </div>
      </CardContent>
    </Card>
  );
}

