'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useMarketDataStore } from '@/lib/market-data-service';
import { useMarkets } from '@/hooks/use-markets';

/**
 * Canvas Depth Chart — Full Final Integration (Batch 12F-E7)
 *
 * Features:
 * - High DPI scaling
 * - ResizeObserver
 * - Auto-zoom via `depth:autoZoom` events
 * - Price/quantity precision snapping (uses markets collection's fields)
 * - Eased animated visible range
 * - Splines (Catmull-Rom) for curves
 * - Area shading, bubbles, wall heat
 * - Hover (crosshair + tooltip + snap)
 * - Best Bid / Best Ask banners
 * - Performance Tuning (GPU smoothing, low-FPS mode, sampling improvements)
 */

interface CanvasDepthChartProps {
  marketId: string;
  height?: number;
}

export default function CanvasDepthChart({ marketId, height = 360 }: CanvasDepthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Market config
  const { data: markets } = useMarkets();
  const market = useMemo(() => markets?.find((m: any) => m.id === marketId) ?? null, [markets, marketId]);
  const pricePrecision = market?.pricePrecision ?? 2;
  const quantityPrecision = market?.quantityPrecision ?? 4;

  // Data from store
  const bids = useMarketDataStore((s) => s.bids); // ProcessedOrder[] with {price, size, isWall}
  const asks = useMarketDataStore((s) => s.asks);
  const ticker = useMarketDataStore((s) => s.ticker);
  const isConnected = useMarketDataStore((s) => s.isConnected);

  // Layout state
  const [dim, setDim] = useState({ width: 800, height }); // CSS pixels
  useEffect(() => setDim((d) => ({ ...d, height })), [height]);

  // Animated visible range (min/max price)
  const [animatedRange, setAnimatedRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });
  const targetRangeRef = useRef<{ min: number; max: number }>({ min: 0, max: 0 });

  // Hover state
  const hoverRef = useRef<{ x: number; y: number } | null>(null);

  // Banner pos smoothing
  const bannerPos = useRef({ bidX: 0, askX: 0 });

  // --- Performance tuning / low-CPU controls ---
  const lowCpuModeRef = useRef(false); // set to true to force low CPU mode

  // Desired FPS depending on mode
  const MAX_FPS_HIGH = 144;
  const MAX_FPS_NORMAL = 60;
  const MAX_FPS_LOW = 30;

  // Adaptive sampling thresholds
  const TARGET_SPLINE_POINTS = 60; // normal
  const LOW_CPU_SPLINE_POINTS = 30; // low cpu

  // offscreen canvas support
  const offscreenRef = useRef<OffscreenCanvas | null>(null);
  const useOffscreen = typeof window !== 'undefined' && 'OffscreenCanvas' in window;

  // For debug / UI toggles — temporarily expose on window for quick tests
  useEffect(() => {
    (window as any).__fk_lowCpuToggle = (val: boolean) => { lowCpuModeRef.current = !!val; };
    return () => { delete (window as any).__fk_lowCpuToggle; };
  }, []);

  // ------------------------------
  // Utilities: snapping & rounding
  // ------------------------------
  const pow10 = (p: number) => Math.pow(10, p);
  function snapPrice(price: number, precision: number) {
    const f = pow10(precision);
    return Math.round(price * f) / f;
  }
  function floorPrice(price: number, precision: number) {
    const f = pow10(precision);
    return Math.floor(price * f) / f;
  }
  function ceilPrice(price: number, precision: number) {
    const f = pow10(precision);
    return Math.ceil(price * f) / f;
  }

  // Quantity rounding (hybrid)
  function floorQty(q: number, precision: number) {
    const f = pow10(precision);
    return Math.floor(q * f) / f;
  }
  function roundQty(q: number, precision: number) {
    const f = pow10(precision);
    return Math.round(q * f) / f;
  }
  function ceilQty(q: number, precision: number) {
    const f = pow10(precision);
    return Math.ceil(q * f) / f;
  }

  // Easing helpers
  function ease(current: number, target: number, factor = 0.16) {
    return current + (target - current) * factor;
  }
  function nearlyEq(a: number, b: number, tol = 1e-9) {
    return Math.abs(a - b) < tol;
  }

  // ------------------------------
  // Auto-zoom compute (Binance Spot 4% padding)
  // ------------------------------
  function computeVisibleRange(bestBid: number, bestAsk: number, pricePrec: number) {
    if (!bestBid || !bestAsk || bestBid <= 0 || bestAsk <= 0) return { min: 0, max: 0 };
    const PAD = 0.04;
    const paddedMin = bestBid * (1 - PAD);
    const paddedMax = bestAsk * (1 + PAD);
    const min = floorPrice(paddedMin, pricePrec);
    const max = ceilPrice(paddedMax, pricePrec);
    return { min, max };
  }

  // ------------------------------
  // Canvas prepare (HiDPI)
  // ------------------------------
  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = parentRef.current;
    if (!canvas || !parent) return null;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    const w = rect.width || dim.width;
    const h = dim.height;

    canvas.style.width = `${Math.floor(w)}px`;
    canvas.style.height = `${Math.floor(h)}px`;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale to CSS pixels
    return ctx;
  }, [dim.height, dim.width]);

  // ------------------------------
  // Resize observer
  // ------------------------------
  useEffect(() => {
    if (!parentRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = e.contentRect.width;
        setDim((d) => ({ ...d, width: Math.max(320, Math.floor(w)) }));
      }
    });
    ro.observe(parentRef.current);
    return () => ro.disconnect();
  }, []);

  // ------------------------------
  // Listen for auto-zoom events emitted by MarketDataService
  // ------------------------------
  useEffect(() => {
    function onZoom(_e: Event) {
      const store = useMarketDataStore.getState();
      const stBids = store.bids;
      const stAsks = store.asks;
      if (!stBids?.length || !stAsks?.length) return;

      const bestBid = stBids[0].price;
      const bestAsk = stAsks[0].price;

      const { min, max } = computeVisibleRange(bestBid, bestAsk, pricePrecision);
      targetRangeRef.current = { min, max };
    }
    window.addEventListener('depth:autoZoom', onZoom);
    return () => window.removeEventListener('depth:autoZoom', onZoom);
  }, [pricePrecision]);

  // Also compute initial targetRange from ticker/orderbook
  useEffect(() => {
    if (!bids?.length || !asks?.length) return;
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    const { min, max } = computeVisibleRange(bestBid, bestAsk, pricePrecision);
    targetRangeRef.current = { min, max };
    setAnimatedRange({ min, max });
  }, [bids.length, asks.length, pricePrecision]);

  // ------------------------------
  // Coordinate mapping helpers
  // ------------------------------
  function mapPriceToY(price: number, minP: number, maxP: number, heightPx: number) {
    if (maxP === minP) return heightPx / 2;
    const t = (price - minP) / (maxP - minP);
    return heightPx - t * heightPx;
  }
  function mapCumToX(cum: number, maxCum: number, widthPx: number) {
    if (!maxCum) return 0;
    const t = cum / maxCum;
    return t * widthPx;
  }

  // ------------------------------
  // Spline utilities (Catmull-Rom)
  // ------------------------------
  function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number) {
    const v0 = (p2 - p0) * 0.5;
    const v1 = (p3 - p1) * 0.5;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
  }
  function getSplinePoints(points: { x: number; y: number; price?: number; cum?: number }[]) {
    if (!points || points.length < 2) return points.slice();
    const out: { x: number; y: number; price?: number; cum?: number }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      for (let t = 0; t <= 1; t += 0.125) {
        const nx = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
        const ny = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
        out.push({ x: nx, y: ny, price: undefined, cum: undefined });
      }
    }
    return out;
  }

  // ------------------------------
  // Intensity & color mapping (heat)
  // ------------------------------
  function computeIntensity(cum: number, maxCum: number) {
    if (!maxCum) return 0;
    let t = cum / maxCum;
    t = Math.pow(t, 0.55);
    return Math.min(1, Math.max(0, t));
  }
  function heatColor(side: 'bid' | 'ask', t: number) {
    const opacity = 0.2 + t * 0.55;
    if (side === 'bid') {
      const r = Math.floor(40 - t * 30);
      const g = Math.floor(200 + t * 40);
      const b = 110;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    const r = Math.floor(210 + t * 40);
    const g = Math.floor(80 - t * 30);
    const b = Math.floor(80 - t * 30);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // ------------------------------
  // Tooltip helper: find nearest point
  // ------------------------------
  function findNearestPoint(points: { x: number; y: number; price?: number; cum?: number; size?: number }[], x: number) {
    if (!points || points.length === 0) return null;
    let best = null;
    let bestDist = Infinity;
    for (const p of points) {
      const dx = Math.abs(p.x - x);
      if (dx < bestDist) {
        bestDist = dx;
        best = p;
      }
    }
    return best;
  }

  // ------------------------------
  // Banner utility (rounded rect)
  // ------------------------------
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill = true, stroke = false) {
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
  function drawBanner(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: 'bid' | 'ask', dpr: number, canvasWidth: number) {
    const paddingX = 8 * dpr;
    ctx.font = `${12 * dpr}px Inter, sans-serif`;
    const textW = ctx.measureText(text).width;
    const boxW = textW + paddingX * 2;
    const boxH = 24 * dpr;
    const bx = Math.min(Math.max(x - boxW / 2, 4 * dpr), canvasWidth - boxW - 4 * dpr);
    const by = Math.max(y - boxH - 10 * dpr, 4 * dpr);
    ctx.fillStyle = color === 'bid' ? 'rgba(34,180,115,0.96)' : 'rgba(230,70,70,0.96)';
    roundRect(ctx, bx, by, boxW, boxH, 4 * dpr, true, false);
    ctx.strokeStyle = color === 'bid' ? 'rgba(34,255,160,0.18)' : 'rgba(255,120,120,0.18)';
    ctx.lineWidth = 1 * dpr;
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + paddingX, by + boxH / 2);
  }

  // ------------------------------
  // Build depth points for canvas
  // ------------------------------
  function buildDepthPointsForCanvas(
    rawBids: any[],
    rawAsks: any[],
    pricePrec: number,
    qtyPrec: number,
    minPrice: number,
    maxPrice: number,
    widthPx: number,
    heightPx: number
  ) {
    const processedBids = rawBids
      .map((b) => ({ price: snapPrice(b.price, pricePrec), size: floorQty(b.size, qtyPrec), isWall: !!b.isWall }))
      .sort((a, b) => b.price - a.price);

    const processedAsks = rawAsks
      .map((a) => ({ price: snapPrice(a.price, pricePrec), size: floorQty(a.size, qtyPrec), isWall: !!a.isWall }))
      .sort((a, b) => a.price - b.price);

    let cumB = 0;
    const pointsBid: { x: number; y: number; price: number; cum: number; size: number; isWall: boolean }[] = [];
    processedBids.forEach((lvl) => {
      cumB += lvl.size;
      const x = 0;
      const y = mapPriceToY(lvl.price, minPrice, maxPrice, heightPx);
      pointsBid.push({ x, y, price: lvl.price, cum: cumB, size: lvl.size, isWall: lvl.isWall });
    });

    let cumA = 0;
    const pointsAsk: { x: number; y: number; price: number; cum: number; size: number; isWall: boolean }[] = [];
    processedAsks.forEach((lvl) => {
      cumA += lvl.size;
      const x = 0;
      const y = mapPriceToY(lvl.price, minPrice, maxPrice, heightPx);
      pointsAsk.push({ x, y, price: lvl.price, cum: cumA, size: lvl.size, isWall: lvl.isWall });
    });

    const maxCum = Math.max(pointsBid.length ? pointsBid[pointsBid.length - 1].cum : 0, pointsAsk.length ? pointsAsk[pointsAsk.length - 1].cum : 0) || 1;

    for (const p of pointsBid) p.x = mapCumToX(p.cum, maxCum, widthPx);
    for (const p of pointsAsk) p.x = mapCumToX(p.cum, maxCum, widthPx);

    return { pointsBid, pointsAsk, maxCum };
  }

  // ------------------------------
  // Main draw function
  // ------------------------------
  const draw = useCallback(() => {
    const ctx = prepareCanvas();
    if (!ctx || !canvasRef.current || !parentRef.current) return;

    const width = dim.width;
    const heightPx = dim.height;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, heightPx);

    if (!bids?.length || !asks?.length) {
      ctx.fillStyle = '#888';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText('Waiting for market depth...', 12, 20);
      return;
    }

    const tr = targetRangeRef.current;
    setAnimatedRange((prev) => {
      const nextMin = prev.min === 0 ? tr.min : ease(prev.min, tr.min, 0.18);
      const nextMax = prev.max === 0 ? tr.max : ease(prev.max, tr.max, 0.18);
      if (nearlyEq(nextMin, prev.min) && nearlyEq(nextMax, prev.max)) return prev;
      return { min: nextMin, max: nextMax };
    });

    const { min: minPrice, max: maxPrice } = animatedRange;

    if (!minPrice || !maxPrice || minPrice >= maxPrice) {
      ctx.fillStyle = '#888';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText('Calculating view range...', 12, 20);
      return;
    }

    const { pointsBid, pointsAsk, maxCum } = buildDepthPointsForCanvas(bids, asks, pricePrecision, quantityPrecision, minPrice, maxPrice, width, heightPx);

    const targetPoints = lowCpuModeRef.current ? LOW_CPU_SPLINE_POINTS : TARGET_SPLINE_POINTS;
    const sampleBid = pointsBid.length > targetPoints ? pointsBid.filter((_, i) => i % Math.ceil(pointsBid.length / targetPoints) === 0) : pointsBid;
    const sampleAsk = pointsAsk.length > targetPoints ? pointsAsk.filter((_, i) => i % Math.ceil(pointsAsk.length / targetPoints) === 0) : pointsAsk;

    const simpleBid = sampleBid.map(p => ({ x: p.x, y: p.y, price: p.price, cum: p.cum, size: p.size }));
    const simpleAsk = sampleAsk.map(p => ({ x: p.x, y: p.y, price: p.price, cum: p.cum, size: p.size }));

    const bidSpline = getSplinePoints(simpleBid);
    const askSpline = getSplinePoints(simpleAsk);

    if (askSpline.length) {
      ctx.beginPath();
      ctx.moveTo(askSpline[0].x, askSpline[0].y);
      for (const p of askSpline) ctx.lineTo(p.x, p.y);
      ctx.lineTo(width, heightPx);
      ctx.lineTo(0, heightPx);
      const grad = ctx.createLinearGradient(0, 0, 0, heightPx);
      grad.addColorStop(0, 'rgba(255,70,70,0.18)');
      grad.addColorStop(1, 'rgba(255,70,70,0.02)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    if (bidSpline.length) {
      ctx.beginPath();
      ctx.moveTo(bidSpline[0].x, bidSpline[0].y);
      for (const p of bidSpline) ctx.lineTo(p.x, p.y);
      ctx.lineTo(width, heightPx);
      ctx.lineTo(0, heightPx);
      const grad = ctx.createLinearGradient(0, 0, 0, heightPx);
      grad.addColorStop(0, 'rgba(50,200,120,0.18)');
      grad.addColorStop(1, 'rgba(50,200,120,0.02)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    if (askSpline.length) {
      ctx.strokeStyle = 'rgba(255,100,110,0.9)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < askSpline.length; i++) {
        const p = askSpline[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    if (bidSpline.length) {
      ctx.strokeStyle = 'rgba(60,210,130,0.9)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < bidSpline.length; i++) {
        const p = bidSpline[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    const maxCumVal = maxCum;
    const fullBidPoints = pointsBid;
    const fullAskPoints = pointsAsk;

    const getNearestOriginalForX = (arr: any[], x: number) => {
      let best = arr[0];
      let bd = Math.abs(arr[0].x - x);
      for (const p of arr) {
        const d = Math.abs(p.x - x);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    };

    for (const s of bidSpline) {
      const orig = getNearestOriginalForX(fullBidPoints, s.x);
      const intensity = computeIntensity(orig?.cum ?? 0, maxCumVal);
      const radius = 1.8 + (8 - 1.8) * intensity;
      const color = heatColor('bid', intensity);
      if (intensity > 0.75) { ctx.shadowBlur = 12; ctx.shadowColor = color; } else ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of askSpline) {
      const orig = getNearestOriginalForX(fullAskPoints, s.x);
      const intensity = computeIntensity(orig?.cum ?? 0, maxCumVal);
      const radius = 1.8 + (8 - 1.8) * intensity;
      const color = heatColor('ask', intensity);
      if (intensity > 0.75) { ctx.shadowBlur = 12; ctx.shadowColor = color; } else ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    const dpr = window.devicePixelRatio || 1;
    const bestBidPoint = fullBidPoints.length ? fullBidPoints[0] : null;
    const bestAskPoint = fullAskPoints.length ? fullAskPoints[0] : null;

    if (bestBidPoint) {
      bannerPos.current.bidX = bannerPos.current.bidX ? ease(bannerPos.current.bidX, bestBidPoint.x, 0.18) : bestBidPoint.x;
    }
    if (bestAskPoint) {
      bannerPos.current.askX = bannerPos.current.askX ? ease(bannerPos.current.askX, bestAskPoint.x, 0.18) : bestAskPoint.x;
    }

    if (bestBidPoint) {
      drawBanner(ctx, bannerPos.current.bidX, bestBidPoint.y, `Bid: ${bestBidPoint.price.toFixed(pricePrecision)}`, 'bid', dpr, width);
    }
    if (bestAskPoint) {
      drawBanner(ctx, bannerPos.current.askX, bestAskPoint.y, `Ask: ${bestAskPoint.price.toFixed(pricePrecision)}`, 'ask', dpr, width);
    }

    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dprCss = window.devicePixelRatio || 1;
    if (hoverRef.current) {
      const hx = hoverRef.current.x / dprCss;
      const hy = hoverRef.current.y / dprCss;
      const pBid = findNearestPoint(bidSpline, hx);
      const pAsk = findNearestPoint(askSpline, hx);
      let target = null;
      if (pBid && pAsk) target = Math.abs(pBid.x - hx) < Math.abs(pAsk.x - hx) ? pBid : pAsk;
      else target = pBid || pAsk;

      if (target) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.moveTo(target.x, 0);
        ctx.lineTo(target.x, heightPx);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
        ctx.fill();

        const tooltipW = 160;
        const tooltipH = 68;
        const boxX = Math.min(Math.max(target.x - tooltipW / 2, 4), width - tooltipW - 4);
        const boxY = Math.max(target.y - tooltipH - 8, 4);

        ctx.fillStyle = 'rgba(22,22,22,0.95)';
        roundRect(ctx, boxX, boxY, tooltipW, tooltipH, 6, true, false);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeRect(boxX, boxY, tooltipW, tooltipH);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter, sans-serif';
        ctx.textBaseline = 'top';
        const priceStr = `Price: ${target.price ? target.price.toFixed(pricePrecision) : '-'}`;
        const cumStr = `Cum: ${target.cum ?? '-'}`;
        const sizeStr = `Size: ${target.size ?? '-'}`;
        ctx.fillText(priceStr, boxX + 8, boxY + 8);
        ctx.fillText(cumStr, boxX + 8, boxY + 28);
        ctx.fillText(sizeStr, boxX + 8, boxY + 46);
      }
    }

  },
  [
    prepareCanvas,
    dim.width,
    dim.height,
    bids,
    asks,
    pricePrecision,
    quantityPrecision,
    animatedRange.min,
    animatedRange.max
  ]);

  // ------------------------------
  // Throttled animation loop + Offscreen support
  // ------------------------------
  useEffect(() => {
    let last = performance.now();
    let rafId = 0;
    let frameInterval = 1000 / MAX_FPS_NORMAL;

    function computeFrameInterval() {
      const low = lowCpuModeRef.current;
      if (low) return 1000 / MAX_FPS_LOW;
      return 1000 / MAX_FPS_NORMAL;
    }

    if (useOffscreen && !offscreenRef.current) {
      try {
        const c = new OffscreenCanvas(Math.max(1, Math.floor(dim.width)), Math.max(1, Math.floor(dim.height)));
        offscreenRef.current = c;
      } catch (e) {
        offscreenRef.current = null;
      }
    }

    function drawFrame(now: number) {
      if (document.hidden) {
        last = now;
        rafId = requestAnimationFrame(drawFrame);
        return;
      }

      frameInterval = computeFrameInterval();
      const delta = now - last;
      if (delta < frameInterval) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }
      last = now - (delta % frameInterval);

      if (useOffscreen && offscreenRef.current) {
        const off = offscreenRef.current;
        const dpr = window.devicePixelRatio || 1;
        const targetW = Math.max(1, Math.floor(dim.width * dpr));
        const targetH = Math.max(1, Math.floor(dim.height * dpr));
        if (off.width !== targetW || off.height !== targetH) {
          off.width = targetW;
          off.height = targetH;
        }
        const ctxOff = off.getContext('2d');
        if (!ctxOff) {
          draw();
        } else {
          ctxOff.setTransform(dpr, 0, 0, dpr, 0, 0);
          draw();
        }
      } else {
        draw();
      }

      rafId = requestAnimationFrame(drawFrame);
    }

    rafId = requestAnimationFrame(drawFrame);

    const onVisibility = () => {
      if (document.hidden) {
        // Paused
      } else {
        last = performance.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [draw, dim.width, dim.height, useOffscreen]);

  // ------------------------------
  // Pointer move throttled via RAF
  // ------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let pending = false;
    const dpr = window.devicePixelRatio || 1;

    const onPointerMove = (e: PointerEvent) => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        const r = canvas.getBoundingClientRect();
        const x = (e.clientX - r.left) * dpr;
        const y = (e.clientY - r.top) * dpr;
        hoverRef.current = { x, y };
        pending = false;
      });
    };

    const onLeave = () => { hoverRef.current = null; };

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div ref={parentRef} className="w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
