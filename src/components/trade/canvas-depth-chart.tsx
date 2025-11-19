
'use client';

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useMarketDataStore } from '@/state/market-data-store';
import { useMarkets } from '@/hooks/use-markets';

interface CanvasDepthChartProps {
  marketId: string;
  // parent provides CSS height; this is used for initial sizing and resize handling
  height?: number;
}

export default function CanvasDepthChart({ marketId, height = 420 }: CanvasDepthChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const bids = useMarketDataStore((s) => s.bids);
  const asks = useMarketDataStore((s) => s.asks);
  const ticker = useMarketDataStore((s) => s.ticker);
  const { data: markets } = useMarkets();
  const market = useMemo(() => markets?.find((m: any) => m.id === marketId) ?? null, [markets, marketId]);
  const pricePrecision = market?.pricePrecision ?? 2;
  const qtyPrecision = market?.quantityPrecision ?? 4;

  // simple dims state (CSS pixels)
  const [cssSize, setCssSize] = useState({ w: 800, h: height });

  // Prepare canvas (set actual pixel buffer appropriately) - only on resize or dpr change
  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;

    // only resize when changed (avoid per-frame style updates)
    if (cssSize.w !== cssW || cssSize.h !== cssH) {
      setCssSize({ w: cssW, h: cssH });
    }

    // set backing store size in device pixels
    const targW = Math.max(1, Math.floor(cssW * dpr));
    const targH = Math.max(1, Math.floor(cssH * dpr));
    if (canvas.width !== targW || canvas.height !== targH) {
      canvas.width = targW;
      canvas.height = targH;
      // set CSS size once (kept stable)
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }
  }, [cssSize.w, cssSize.h]);

  useEffect(() => {
    prepareCanvas();
    const ro = new ResizeObserver(() => prepareCanvas());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [prepareCanvas]);

  // small helper utilities (snapping / mapping)
  const snap = (n: number, p = pricePrecision) => {
    const f = Math.pow(10, p);
    return Math.round(n * f) / f;
  };

  // basic draw function (keeps logic simple)
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // coordinate space is CSS pixels (we scaled canvas via style and device pixels in attributes)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = cssSize.w;
    const h = cssSize.h;

    // background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#061018';
    ctx.fillRect(0, 0, w, h);

    // Minimal guard: when no data
    if (!bids?.length || !asks?.length) {
      ctx.fillStyle = '#9aa3ad';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText('Waiting for depth data...', 16, 26);
      return;
    }

    // compute price range around best bid/ask
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    const pad = 0.04;
    const minPrice = Math.floor(bestBid * (1 - pad));
    const maxPrice = Math.ceil(bestAsk * (1 + pad));
    const priceRange = maxPrice - minPrice || 1;

    // compute cumulative volumes
    let cumB = 0;
    const bidPoints = bids.map((l) => {
      cumB += l.size;
      return { price: l.price, size: l.size, cum: cumB, isWall: !!l.isWall };
    });
    let cumA = 0;
    const askPoints = asks.map((l) => {
      cumA += l.size;
      return { price: l.price, size: l.size, cum: cumA, isWall: !!l.isWall };
    });
    const maxCum = Math.max(cumB, cumA, 1);

    // mapping helpers
    const priceToY = (price: number) => {
      const t = (price - minPrice) / priceRange;
      return h - t * h;
    };
    const cumToX = (cum: number) => {
      return (cum / maxCum) * w;
    };

    // draw simple areas + lines (optimized sample)
    const sample = (arr: any[], cap = 80) => {
      if (arr.length <= cap) return arr;
      const step = Math.ceil(arr.length / cap);
      return arr.filter((_, i) => i % step === 0);
    };
    const sB = sample(bidPoints);
    const sA = sample(askPoints);

    // ASK area
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < sA.length; i++) {
      const p = sA[i];
      ctx.lineTo(cumToX(p.cum), priceToY(p.price));
    }
    ctx.lineTo(w, h);
    const gradA = ctx.createLinearGradient(0, 0, 0, h);
    gradA.addColorStop(0, 'rgba(255,80,90,0.14)');
    gradA.addColorStop(1, 'rgba(255,80,90,0.02)');
    ctx.fillStyle = gradA;
    ctx.fill();

    // BID area
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < sB.length; i++) {
      const p = sB[i];
      ctx.lineTo(cumToX(p.cum), priceToY(p.price));
    }
    ctx.lineTo(w, h);
    const gradB = ctx.createLinearGradient(0, 0, 0, h);
    gradB.addColorStop(0, 'rgba(40,200,120,0.14)');
    gradB.addColorStop(1, 'rgba(40,200,120,0.02)');
    ctx.fillStyle = gradB;
    ctx.fill();

    // CURVES (light stroke)
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,100,110,0.9)';
    ctx.beginPath();
    for (let i = 0; i < sA.length; i++) {
      const p = sA[i];
      if (i === 0) ctx.moveTo(cumToX(p.cum), priceToY(p.price));
      else ctx.lineTo(cumToX(p.cum), priceToY(p.price));
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(60,210,130,0.95)';
    ctx.beginPath();
    for (let i = 0; i < sB.length; i++) {
      const p = sB[i];
      if (i === 0) ctx.moveTo(cumToX(p.cum), priceToY(p.price));
      else ctx.lineTo(cumToX(p.cum), priceToY(p.price));
    }
    ctx.stroke();

    // small grid & right price labels
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const gridSteps = 6;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#9aa3ad';
    for (let i = 0; i <= gridSteps; i++) {
      const gy = (h / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
      const price = (maxPrice - (i / gridSteps) * priceRange);
      ctx.fillText(snap(price, pricePrecision).toFixed(pricePrecision), w - 68, gy - 6);
    }

    // best bid/ask markers
    ctx.fillStyle = '#1ef0b5';
    ctx.fillRect(6, priceToY(bestBid) - 8, 56, 3);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(6, priceToY(bestAsk) + 5, 56, 3);

  // end draw
  }, [cssSize.w, cssSize.h, bids, asks, pricePrecision, qtyPrecision, ticker]);

  // animation loop (throttled to 60fps by default)
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const targetInterval = 1000 / 60;
    const loop = (t: number) => {
      if (t - last >= targetInterval) {
        draw();
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  // Render
  return (
    <div ref={wrapperRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
