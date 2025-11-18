
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

function getSplinePoints(points: { x: number; y: number, cum: number, price: number }[]) {
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
        price: catmullRom(p0.price, p1.price, p2.price, p3.price, t),
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
// Banner drawing helper (Best Bid / Best Ask)
// ---------------------------------------------------------
function drawBanner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: 'bid' | 'ask',
  dpr: number,
  canvasWidth: number
) {
  const paddingX = 8 * dpr;
  const paddingY = 6 * dpr;
  ctx.font = `${12 * dpr}px Inter, sans-serif`;

  // measure text
  const textW = ctx.measureText(text).width;
  const boxW = textW + paddingX * 2;
  const boxH = 24 * dpr;

  // clamp horizontally within canvas
  const bx = Math.min(Math.max(x - boxW / 2, 4 * dpr), canvasWidth - boxW - 4 * dpr);
  const by = Math.max(y - boxH - 10 * dpr, 4 * dpr);

  // background
  ctx.fillStyle = color === 'bid' ? 'rgba(34,180,115,0.96)' : 'rgba(230,70,70,0.96)';
  roundRect(ctx, bx, by, boxW, boxH, 4 * dpr, true, true);

  // subtle border
  ctx.strokeStyle = color === 'bid' ? 'rgba(34,255,160,0.18)' : 'rgba(255,120,120,0.18)';
  ctx.lineWidth = 1 * dpr;
  ctx.strokeRect(bx, by, boxW, boxH);

  // text
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + paddingX, by + boxH / 2);
}

// small rounded rect util used above
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = true,
  stroke = false
) {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
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
  return t * (width / 2); // Use half width for each side
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
    const { bidPoints: cumulativeBids, askPoints: cumulativeAsks } = buildCumulative(bids, asks, pricePrecision, quantityPrecision);

    const maxCum = Math.max(
        cumulativeBids.length > 0 ? cumulativeBids[cumulativeBids.length - 1].cumulative : 0,
        cumulativeAsks.length > 0 ? cumulativeAsks[cumulativeAsks.length - 1].cumulative : 0
    );

    const pointsBid = cumulativeBids.map(lvl => ({
        price: lvl.price,
        cum: lvl.cumulative,
        size: lvl.size,
        y: mapPriceToY(lvl.price, minPrice, maxPrice, height),
        x: mapCumulativeToX(lvl.cumulative, maxCum, width),
    }));

    const pointsAsk = cumulativeAsks.map(lvl => ({
        price: lvl.price,
        cum: lvl.cumulative,
        size: lvl.size,
        y: mapPriceToY(lvl.price, minPrice, maxPrice, height),
        x: mapCumulativeToX(lvl.cumulative, maxCum, width),
    }));

    return { pointsBid, pointsAsk, maxCum };
}

function findNearestPoint(pts: any[] | null, x: number) {
  if (!pts || pts.length === 0) return null;
  let best = null;
  let bestDist = Infinity;

  for (const p of pts) {
    const dx = Math.abs(p.x - x);
    if (dx < bestDist) {
      bestDist = dx;
      best = p;
    }
  }

  return best;
}

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
      size: b.size,
      cumulative: roundQty(bidCum, quantityPrecision),
    };
  });

  const askPoints = sortedAsks.map((a) => {
    askCum += a.size;
    return {
      price: a.price,
      size: a.size,
      cumulative: roundQty(askCum, quantityPrecision),
    };
  });

  return { bidPoints, askPoints };
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
  const hover = useRef<{ x: number; y: number } | null>(null);
  const bannerPos = useRef({ bidX: 0, askX: 0 });

  function easePos(prev: number, next: number, f = 0.18) {
    return prev + (next - prev) * f;
  }

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
    
    // -------------------------------
    // Mouse move => update hover
    // -------------------------------
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left);
      const y = (e.clientY - rect.top);
      hover.current = { x, y };
    });

    canvas.addEventListener("mouseleave", () => {
      hover.current = null;
    });


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
    
    const dpr = window.devicePixelRatio || 1;

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
        askGrad.addColorStop(0, 'rgba(230, 70, 70, 0.18)');
        askGrad.addColorStop(1, 'rgba(230, 70, 70, 0.02)');
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
      
      // Glow effect for walls
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
      
      // Glow effect for walls
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
    
    ctx.shadowBlur = 0;

    // ---------------------------------------------------------------
    // BEST BID / BEST ASK BANNERS
    // ---------------------------------------------------------------
    {
      const dpr = window.devicePixelRatio || 1;
      // best points are the first points in the spline arrays (closest to spread)
      const bestBidPoint = bidSpline && bidSpline.length ? bidSpline[0] : null;
      const bestAskPoint = askSpline && askSpline.length ? askSpline[0] : null;

      ctx.save();
      // slightly fade banners when user is hovering the chart (optional)
      ctx.globalAlpha = hover.current ? 0.9 : 1.0;

      if (bestBidPoint) {
        bannerPos.current.bidX = easePos(bannerPos.current.bidX || (dim.width/2 - bestBidPoint.x), dim.width/2 - bestBidPoint.x, 0.18);
        const priceTxt = `Bid: ${Number(bestBidPoint.price).toFixed(pricePrecision)}`;
        drawBanner(ctx, bannerPos.current.bidX, bestBidPoint.y, priceTxt, 'bid', dpr, dim.width);
      }

      if (bestAskPoint) {
        bannerPos.current.askX = easePos(bannerPos.current.askX || (bestAskPoint.x + dim.width/2), bestAskPoint.x + dim.width/2, 0.18);
        const priceTxt = `Ask: ${Number(bestAskPoint.price).toFixed(pricePrecision)}`;
        drawBanner(ctx, bannerPos.current.askX, bestAskPoint.y, priceTxt, 'ask', dpr, dim.width);
      }

      ctx.restore();
    }


    // ---------------------------------------------------------------
    // HOVER LAYER (Crosshair + Highlight + Tooltip)
    // ---------------------------------------------------------------
    if (hover.current) {
      const { x: hx, y: hy } = hover.current;

      const bidTarget = findNearestPoint(bidSpline.map(p => ({ ...p, x: dim.width/2 - p.x})), hx);
      const askTarget = findNearestPoint(askSpline.map(p => ({ ...p, x: p.x + dim.width/2})), hx);

      let target = null;
      if (bidTarget && askTarget) {
          target = Math.abs(bidTarget.x - hx) < Math.abs(askTarget.x - hx) ? bidTarget : askTarget;
      } else {
          target = bidTarget || askTarget;
      }

      if (target) {
        // -------- vertical hover line --------
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        ctx.moveTo(target.x, 0);
        ctx.lineTo(target.x, dim.height);
        ctx.stroke();

        // -------- highlight bubble --------
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // -------- tooltip --------
        const tooltipWidth = 140;
        const tooltipHeight = 60;
        const padding = 8;

        const boxX = Math.min(
          Math.max(target.x - tooltipWidth / 2, 0),
          dim.width - tooltipWidth
        );
        const boxY = Math.max(target.y - tooltipHeight - 10, 0);

        // Draw tooltip background
        ctx.fillStyle = "rgba(22, 22, 22, 0.9)";
        ctx.fillRect(boxX, boxY, tooltipWidth, tooltipHeight);

        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.strokeRect(boxX, boxY, tooltipWidth, tooltipHeight);

        // tooltip labels
        ctx.fillStyle = "#fff";
        ctx.font = `11px sans-serif`;

        const priceStr = `Price: ${target.price.toFixed(pricePrecision)}`;
        const cumStr = `Cum: ${target.cum.toFixed(quantityPrecision)}`;
        
        ctx.fillText(priceStr, boxX + padding, boxY + padding + 10);
        ctx.fillText(cumStr, boxX + padding, boxY + padding + 26);
      }
    }


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
      
      const intervalId = setInterval(handler, 100);
      return () => clearInterval(intervalId);
  }, [market, computeVisibleRange]);


  // --------------------------------------
  // Component output
  // --------------------------------------
  return (
    <div ref={parentRef} className="w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}


    