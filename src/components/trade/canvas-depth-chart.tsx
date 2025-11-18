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

// --------------------------------------
// Quantity Rounding (Binance Hybrid)
// --------------------------------------
function floorQty(qty: number, precision: number) {
  const factor = Math.pow(10, precision);
  return Math.floor(qty * factor) / factor;
}

function roundQty(qty: number, precision: number) {
  const factor = Math.pow(10, precision);
  return Math.round(qty * factor) / factor;
}

function ceilQty(qty: number, precision: number) {
  const factor = Math.pow(10, precision);
  return Math.ceil(qty * factor) / factor;
}


// --------------------------------------
// Smooth easing curve (Binance-like)
// --------------------------------------
function ease(current: number, target: number, factor = 0.18) {
  return current + (target - current) * factor;
}

function nearlyEqual(a: number, b: number, tolerance = 0.000001) {
  return Math.abs(a - b) < tolerance;
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

function getSplinePoints(points: { x: number; y: number, cum: number }[]) {
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
        cum: catmullRom(p0.cum, p1.cum, p2.cum, p3.cum, t),
      });
    }
  }

  return out;
}


// ---------------------------------------------------------
// Wall Intensity Calculation (Binance Visual Model)
// ---------------------------------------------------------
function computeWallIntensity(
  cumulative: number,
  maxCumulative: number
) {
  if (maxCumulative === 0) return 0;

  // Normalized 0–1 value
  let ratio = cumulative / maxCumulative;

  // Soft nonlinear curve (Binance-like)
  ratio = Math.pow(ratio, 0.65);

  return Math.min(1, Math.max(0, ratio));
}

// ---------------------------------------------------------
// Depth Heat Map Colors (Smooth Gradient)
// ---------------------------------------------------------
function depthColor(side: 'bid' | 'ask', intensity: number) {
  const t = intensity;

  if (side === 'bid') {
    // Green heat • Binance-like
    return `rgba(${Math.floor(0 + t * 0)}, ${Math.floor(
      180 + t * 60
    )}, ${Math.floor(90 + t * 20)}, ${0.20 + t * 0.45})`;
  }

  // Ask heat • Binance-like
  return `rgba(${Math.floor(200 + t * 40)}, ${Math.floor(
    70 + t * 20
  )}, ${Math.floor(70 + t * 20)}, ${0.20 + t * 0.45})`;
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
// Build Cumulative Depth (Binance Hybrid Rounding)
// ---------------------------------------------------------
function buildCumulative(
  bids: RawOrder[],
  asks: RawOrder[],
  pricePrecision: number,
  quantityPrecision: number
) {
  const processedBids = bids.map(([p, s]) => ({
    price: snapPrice(parseFloat(p), pricePrecision),
    size: floorQty(parseFloat(s), quantityPrecision),
  }));

  const processedAsks = asks.map(([p, s]) => ({
    price: snapPrice(parseFloat(p), pricePrecision),
    size: floorQty(parseFloat(s), quantityPrecision),
  }));

  // Sort
  const sortedBids = processedBids.sort((a, b) => b.price - a.price);
  const sortedAsks = processedAsks.sort((a, b) => a.price - b.price);

  // Cumulative (round)
  let bidCum = 0;
  let askCum = 0;

  const bidPoints = sortedBids.map((b) => {
    bidCum += b.size;
    return {
      price: b.price,
      cumulative: roundQty(bidCum, quantityPrecision),
    };
  });

  const askPoints = sortedAsks.map((a) => {
    askCum += a.size;
    return {
      price: a.price,
      cumulative: roundQty(askCum, quantityPrecision),
    };
  });

  return { bidPoints, askPoints };
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

  const {bidPoints: cumulativeBids, askPoints: cumulativeAsks} = buildCumulative(bids as RawOrder[], asks as RawOrder[], pricePrecision, quantityPrecision);

  const maxCum = Math.max(
    cumulativeBids.length > 0 ? cumulativeBids[cumulativeBids.length - 1].cumulative : 0,
    cumulativeAsks.length > 0 ? cumulativeAsks[cumulativeAsks.length - 1].cumulative : 0
  );

  // ---- BIDS (descending price) ----
  for (const lvl of cumulativeBids) {
    const price = lvl.price;
    const cum = lvl.cumulative;
    const x = mapCumulativeToX(cum, maxCum, width / 2);
    const y = mapPriceToY(price, minPrice, maxPrice, height);
    pointsBid.push({ x, y, price, cum });
  }

  // ---- ASKS (ascending price) ----
  for (const lvl of cumulativeAsks) {
    const price = lvl.price;
    const cum = lvl.cumulative;
    const x = mapCumulativeToX(cum, maxCum, width / 2);
    const y = mapPriceToY(price, minPrice, maxPrice, height);
    pointsAsk.push({ x, y, price, cum });
  }


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
  // Smooth animated zoom range
  const [animatedRange, setAnimatedRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 0,
  });

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
        ctx.moveTo(askSpline[0].x + dim.width/2, askSpline[0].y);
        for (const p of askSpline) ctx.lineTo(p.x+ dim.width/2, p.y);
        ctx.lineTo(dim.width / 2, dim.height);
        
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
        ctx.moveTo(dim.width/2 - bidSpline[0].x, bidSpline[0].y);
        for (const p of bidSpline) ctx.lineTo(dim.width/2 -p.x, p.y);
        ctx.lineTo(dim.width / 2, dim.height);

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
          if (i === 0) ctx.moveTo(p.x + dim.width/2, p.y);
          else ctx.lineTo(p.x+ dim.width/2, p.y);
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
          if (i === 0) ctx.moveTo(dim.width/2 - p.x, p.y);
          else ctx.lineTo(dim.width/2 -p.x, p.y);
        }
        ctx.stroke();
    }

    // ---------------------------------------------------------
    // BUBBLE RENDERING (Liquidity Points)
    // ---------------------------------------------------------

    const minR = 1.8;   // Minimum bubble radius
    const maxR = 8.0;   // Maximum radius for large walls

    // ------------- BIDS -------------
    for (const p of bidSpline) {
      const intensity = computeWallIntensity(p.cum ?? 0, maxCum);
      const radius = minR + (maxR - minR) * intensity;
      const color = depthColor('bid', intensity);
      
      if (intensity > 0.75) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(dim.width/2-p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // reset shadow for asks
    ctx.shadowBlur = 0;

    // ------------- ASKS -------------
    for (const p of askSpline) {
      const intensity = computeWallIntensity(p.cum ?? 0, maxCum);
      const radius = minR + (maxR - minR) * intensity;
      const color = depthColor('ask', intensity);
      
      if (intensity > 0.75) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(p.x + dim.width/2, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }


    // Debug text
    ctx.shadowBlur = 0;
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
              const nextMin = ease(prev.min, targetMin, 0.20);
              const nextMax = ease(prev.max, targetMax, 0.20);
              return { min: nextMin, max: nextMax };
          });
      };
      
      if (bids.length && asks.length) handler();
      
      const sub = setInterval(handler, 100);
      return () => clearInterval(sub);
  }, [market, bids, asks, computeVisibleRange]);


  // APPLY ANIMATED ZOOM TO CHART
  useEffect(() => {
    // This is now handled directly in the draw loop, so this effect is no longer needed
  }, [animatedRange]);


  // --------------------------------------
  // Component output
  // --------------------------------------
  return (
    <div ref={parentRef} className="w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
