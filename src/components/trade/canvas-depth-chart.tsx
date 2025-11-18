'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { useMarketDataStore, RawOrder } from '@/lib/market-data-service';
import { useMarkets } from '@/hooks/use-markets';

// -----------------------------
// Price utilities (Binance-Spot)
// -----------------------------
function snapPrice(price: number, precision: number) {
  const factor = Math.pow(10, precision);
  return Math.round(price * factor) / factor;
}

function floorPrice(price: number, precision: number) {
  const factor = Math.pow(10, precision);
  return Math.floor(price * factor) / factor;
}

function ceilPrice(price: number, precision: number) {
  const factor = Math.pow(10, precision);
  return Math.ceil(price * factor) / factor;
}

// ---------------------------------------------------------
// Simple Catmull–Rom Spline Interpolation
// ---------------------------------------------------------
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number) {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t * t * t;
  return (
    (2 * p1 - 2 * p2 + v0 + v1) * t3 +
    (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
    v0 * t +
    p1
  );
}

function getSplinePoints(points: { x: number; y: number }[]) {
  if (points.length < 2) return points;

  const out = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    // Generate 10 interpolated points
    for (let t = 0; t <= 1; t += 0.1) {
      out.push({
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, t),
      });
    }
  }

  return out;
}

// ---------------------------------------------------------
// Coordinate Mapping Helpers
// ---------------------------------------------------------
function mapPriceToY(
  price: number,
  minPrice: number,
  maxPrice: number,
  height: number
) {
  if (maxPrice === minPrice) return height / 2;
  const t = (price - minPrice) / (maxPrice - minPrice);
  return height - t * height;
}

function mapCumulativeToX(
  cumulative: number,
  maxCumulative: number,
  width: number
) {
  if (!maxCumulative) return 0;
  const t = cumulative / maxCumulative;
  return t * width;
}

// ---------------------------------------------------------
// Transform Raw Depth Into Canvas-Ready Points
// ---------------------------------------------------------
function buildDepthPoints(
  bids: any[],
  asks: any[],
  pricePrecision: number,
  quantityPrecision: number,
  minPrice: number,
  maxPrice: number,
  width: number,
  height: number
) {
  const pointsBid: { x: number; y: number; price: number; cum: number }[] = [];
  const pointsAsk: { x: number; y: number; price: number; cum: number }[] = [];

  // ---- BIDS (descending price) ----
  let cumBid = 0;
  for (const lvl of bids) {
    const price = lvl.price;
    const qty = lvl.size;
    cumBid += qty;

    const x = mapCumulativeToX(cumBid, cumBid, width); // cumulative normalized later
    const y = mapPriceToY(price, minPrice, maxPrice, height);

    pointsBid.push({ x, y, price, cum: cumBid });
  }

  // ---- ASKS (ascending price) ----
  let cumAsk = 0;
  for (const lvl of asks) {
    const price = lvl.price;
    const qty = lvl.size;
    cumAsk += qty;

    const x = mapCumulativeToX(cumAsk, cumAsk, width); // cumulative normalized later
    const y = mapPriceToY(price, minPrice, maxPrice, height);

    pointsAsk.push({ x, y, price, cum: cumAsk });
  }

  // -------- Normalize cumulative X across both sides --------
  const maxCum = Math.max(
    pointsBid.length ? pointsBid[pointsBid.length - 1].cum : 0,
    pointsAsk.length ? pointsAsk[pointsAsk.length - 1].cum : 0
  );

  for (const p of pointsBid) p.x = mapCumulativeToX(p.cum, maxCum, width / 2);
  for (const p of pointsAsk) p.x = mapCumulativeToX(p.cum, maxCum, width / 2);

  return { pointsBid, pointsAsk, maxCum };
}


interface CanvasDepthChartProps {
  marketId: string;
  height?: number;
}

export default function CanvasDepthChart({
  marketId,
  height = 360,
}: CanvasDepthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  // Market precision
  const { data: markets } = useMarkets();
  const market = useMemo(() => {
    return markets?.find((m) => m.id === marketId) ?? null;
  }, [markets, marketId]);

  const pricePrecision = market?.pricePrecision ?? 2;
  const quantityPrecision = market?.quantityPrecision ?? 4;

  // Store data
  const bids = useMarketDataStore((s) => s.bids);
  const asks = useMarketDataStore((s) => s.asks);
  const isConnected = useMarketDataStore((s) => s.isConnected);

  // Internal render state
  const animationRef = useRef<number>(0);
  const [dim, setDim] = useState({ width: 0, height });
  const [animatedRange, setAnimatedRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });

  const computeVisibleRange = useCallback((bestBid: number, bestAsk: number, pricePrecision: number) => {
    if (!bestBid || !bestAsk || bestBid <= 0 || bestAsk <= 0) {
      return { min: 0, max: 0 };
    }

    const PAD = 0.04;
    const paddedMin = bestBid * (1 - PAD);
    const paddedMax = bestAsk * (1 + PAD);
    const min = floorPrice(paddedMin, pricePrecision);
    const max = ceilPrice(paddedMax, pricePrecision);
    return { min, max };
  }, []);

  // ----------------------------
  // ResizeObserver → auto-scale
  // ----------------------------
  useEffect(() => {
    if (!parentRef.current) return;

    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setDim({ width, height });
      }
    });

    ro.observe(parentRef.current);
    return () => ro.disconnect();
  }, [height]);

  // --------------------------------------
  // Prepare canvas for High DPI rendering
  // --------------------------------------
  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dim.width * dpr;
    canvas.height = dim.height * dpr;
    canvas.style.width = `${dim.width}px`;
    canvas.style.height = `${dim.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    return ctx;
  }, [dim]);

  // --------------------------------------
  // Main draw loop
  // --------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = prepareCanvas();
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, dim.width, dim.height);

    // ---------------------------------------------------------
    // Compute Price Range From Auto-Zoom (Existing Logic)
    // ---------------------------------------------------------
    const store = useMarketDataStore.getState();
    const depthBids = store.bids;
    const depthAsks = store.asks;

    if (!depthBids.length || !depthAsks.length) {
      ctx.fillStyle = '#666';
      ctx.fillText('Waiting for depth data…', 10, 110);
      return;
    }

    const minPrice = animatedRange.min;
    const maxPrice = animatedRange.max;

    if (!minPrice || !maxPrice || minPrice >= maxPrice) {
        // Debug text
        ctx.fillStyle = '#ccc';
        ctx.font = '12px Inter';
        ctx.fillText(`Depth Chart — Canvas Engine`, 10, 20);
        ctx.fillText(`Market: ${marketId}`, 10, 40);
        ctx.fillText(`Bids: ${bids.length} | Asks: ${asks.length}`, 10, 60);
        ctx.fillText(
          `Precision: price=${pricePrecision}, qty=${quantityPrecision}`,
          10,
          80
        );
        return;
    };

    // ---------------------------------------------------------
    // Convert depth to canvas points
    // ---------------------------------------------------------
    const { pointsBid, pointsAsk, maxCum } = buildDepthPoints(
      depthBids,
      depthAsks,
      pricePrecision,
      quantityPrecision,
      minPrice,
      maxPrice,
      dim.width,
      dim.height
    );

    // -------- Build smooth spline curves --------
    const bidSpline = getSplinePoints(pointsBid);
    const askSpline = getSplinePoints(pointsAsk);

    // ---------------------------------------------------
    // DRAW ASK AREA (red shaded)
    // ---------------------------------------------------
    if (askSpline.length > 0) {
        ctx.beginPath();
        ctx.moveTo(askSpline[0].x, askSpline[0].y);
        for (const p of askSpline) ctx.lineTo(p.x, p.y);
        ctx.lineTo(dim.width / 2, dim.height); // Midpoint
        ctx.lineTo(askSpline[0].x, dim.height); // Bottom left of its area
        
        const askGrad = ctx.createLinearGradient(0, 0, 0, dim.height);
        askGrad.addColorStop(0, 'rgba(255, 70, 70, 0.18)');
        askGrad.addColorStop(1, 'rgba(255, 70, 70, 0.02)');
        ctx.fillStyle = askGrad;
        ctx.fill();
    }


    // ---------------------------------------------------
    // DRAW BID AREA (green shaded)
    // ---------------------------------------------------
    if (bidSpline.length > 0) {
        ctx.beginPath();
        ctx.moveTo(bidSpline[0].x, bidSpline[0].y);
        for (const p of bidSpline) ctx.lineTo(p.x, p.y);
        ctx.lineTo(dim.width / 2, dim.height); // Midpoint
        ctx.lineTo(bidSpline[0].x, dim.height); // Bottom right of its area

        const bidGrad = ctx.createLinearGradient(0, 0, 0, dim.height);
        bidGrad.addColorStop(0, 'rgba(50, 200, 120, 0.18)');
        bidGrad.addColorStop(1, 'rgba(50, 200, 120, 0.02)');
        ctx.fillStyle = bidGrad;
        ctx.fill();
    }

    // ---------------------------------------------------
    // DRAW ASK CURVE (thin red line)
    // ---------------------------------------------------
    if (askSpline.length > 0) {
        ctx.strokeStyle = 'rgba(255, 100, 110, 0.9)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < askSpline.length; i++) {
          const p = askSpline[i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    // ---------------------------------------------------
    // DRAW BID CURVE (thin green line)
    // ---------------------------------------------------
    if (bidSpline.length > 0) {
        ctx.strokeStyle = 'rgba(60, 210, 130, 0.9)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < bidSpline.length; i++) {
          const p = bidSpline[i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }


    // Debug (temporary):
    ctx.fillStyle = '#888';
    ctx.font = '12px Inter';
    ctx.fillText(`Depth points: bid=${pointsBid.length} ask=${pointsAsk.length}`, 10, 20);
    ctx.fillText(`maxCum=${maxCum.toFixed(2)}`, 10, 40);
    ctx.fillText(`Range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`, 10, 60);

  }, [prepareCanvas, dim, bids, asks, marketId, pricePrecision, quantityPrecision, animatedRange]);

  // --------------------------------------
  // Animation frame loop
  // --------------------------------------
  const loop = useCallback(() => {
    draw();
    animationRef.current = requestAnimationFrame(loop);
  }, [draw]);

  // Start / Stop animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [loop]);

  // AUTO-ZOOM LISTENER
  useEffect(() => {
      const handler = () => {
          if (!market) return;
          const store = useMarketDataStore.getState();
          const currentBids = store.bids;
          const currentAsks = store.asks;
          if (!currentBids.length || !currentAsks.length) return;

          const bestBid = currentBids[0].price;
          const bestAsk = currentAsks[0].price;
          
          const { min: targetMin, max: targetMax } = computeVisibleRange(bestBid, bestAsk, market.pricePrecision);
          
          setAnimatedRange(prev => {
              if (prev.min === 0 && prev.max === 0) return { min: targetMin, max: targetMax };
              const ease = (current: number, target: number, factor = 0.18) => current + (target - current) * factor;
              const nextMin = ease(prev.min, targetMin, 0.20);
              const nextMax = ease(prev.max, targetMax, 0.20);
              return { min: nextMin, max: nextMax };
          });
      };
      
      if (bids.length && asks.length) handler();
      
      window.addEventListener('depth:autoZoom', handler);
      return () => window.removeEventListener('depth:autoZoom', handler);
  }, [market, bids, asks, computeVisibleRange]);


  // --------------------------------------
  // Component output
  // --------------------------------------
  return (
    <div ref={parentRef} className="w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
