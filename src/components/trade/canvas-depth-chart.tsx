'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
// Wall Intensity Calculation (Binance Visual Model)
// ---------------------------------------------------------
function computeWallIntensity(
  cumulative: number,
  maxCumulative: number
) {
  if (maxCumulative === 0) return 0;
  let ratio = cumulative / maxCumulative;
  ratio = Math.pow(ratio, 0.65);
  return Math.min(1, Math.max(0, ratio));
}

// ---------------------------------------------------------
// Depth Heat Map Colors (Smooth Gradient)
// ---------------------------------------------------------
function depthColor(side: 'bid' | 'ask', intensity: number) {
  const t = intensity;
  if (side === 'bid') {
    return `rgba(${Math.floor(0 + t * 0)}, ${Math.floor(180 + t * 60)}, ${Math.floor(90 + t * 20)}, ${0.20 + t * 0.45})`;
  }
  return `rgba(${Math.floor(200 + t * 40)}, ${Math.floor(70 + t * 20)}, ${Math.floor(70 + t * 20)}, ${0.20 + t * 0.45})`;
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

  const sortedBids = processedBids.sort((a, b) => b.price - a.price);
  const sortedAsks = processedAsks.sort((a, b) => a.price - b.price);

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

export default function CanvasDepthChart({ marketId }: { marketId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: markets } = useMarkets();
  const market = markets?.find(m => m.id === marketId);
  const bids = useMarketDataStore((s) => s.bids);
  const asks = useMarketDataStore((s) => s.asks);
  const ticker = useMarketDataStore((s) => s.ticker);
  
  const [midPrice, setMidPrice] = useState<number | null>(null);
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

  useEffect(() => {
    if (!bids.length || !asks.length) return;
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    const derived = ticker?.c ? parseFloat(ticker.c) : (bestBid + bestAsk) / 2;
    setMidPrice(derived || null);
  }, [bids, asks, ticker]);


  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !market || !animatedRange.max) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { bidPoints, askPoints } = buildCumulative(bids as RawOrder[], asks as RawOrder[], market.pricePrecision, market.quantityPrecision);

    const maxCumBid = bidPoints.length > 0 ? bidPoints[bidPoints.length - 1].cumulative : 0;
    const maxCumAsk = askPoints.length > 0 ? askPoints[askPoints.length - 1].cumulative : 0;
    const maxCumulative = Math.max(maxCumBid, maxCumAsk);
    
    const priceToX = (price: number) => {
        return (price - animatedRange.min) / (animatedRange.max - animatedRange.min) * rect.width;
    }
    const cumToY = (cum: number) => {
        return rect.height - (cum / maxCumulative) * rect.height * 0.9; // Use 90% of height
    }

    const drawArea = (points: {price: number, cumulative: number}[], side: 'bid' | 'ask') => {
        if(points.length === 0) return;
        ctx.beginPath();
        const startX = priceToX(points[0].price);
        ctx.moveTo(startX, rect.height);
        
        for(const point of points) {
            const x = priceToX(point.price);
            const y = cumToY(point.cumulative);
            ctx.lineTo(x,y);
        }
        
        const endX = priceToX(points[points.length - 1].price);
        ctx.lineTo(endX, rect.height);
        ctx.closePath();
        
        const grad = ctx.createLinearGradient(0,0,0, rect.height);
        if (side === 'bid') {
            grad.addColorStop(0, depthColor('bid', 0.8));
            grad.addColorStop(1, depthColor('bid', 0));
        } else {
            grad.addColorStop(0, depthColor('ask', 0.8));
            grad.addColorStop(1, depthColor('ask', 0));
        }
        ctx.fillStyle = grad;
        ctx.fill();

        for (const point of points) {
            const intensity = computeWallIntensity(point.cumulative, maxCumulative);
            const fillColor = depthColor(side, intensity);
            const radius = 2 + intensity * 5;
            const x = priceToX(point.price);
            const y = cumToY(point.cumulative);

            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawArea(bidPoints, 'bid');
    drawArea(askPoints, 'ask');

  }, [bids, asks, market, animatedRange]);


  useEffect(() => {
    const el = containerRef.current;
    if (!el || !midPrice || !animatedRange.max) return;

    const oldLine = el.querySelector('#mid-price-line');
    if (oldLine) oldLine.remove();
    const oldLabel = el.querySelector('#mid-price-label');
    if (oldLabel) oldLabel.remove();

    const pixelX = (midPrice - animatedRange.min) / (animatedRange.max - animatedRange.min) * el.clientWidth;
    if (pixelX < 0 || pixelX > el.clientWidth) return;

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
    label.innerText = midPrice.toFixed(market?.pricePrecision || 2);
    label.style.position = 'absolute';
    label.style.left = `${pixelX > 60 ? pixelX - 60 : pixelX + 5}px`;
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

  }, [midPrice, market, animatedRange]);

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
    
    window.addEventListener('depth:autoZoom', handler);
    return () => window.removeEventListener('depth:autoZoom', handler);
  }, [market, bids, asks, computeVisibleRange]);


  return (
    <div ref={containerRef} className="relative w-full h-full rounded-lg overflow-hidden bg-[#0d0d0d]">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
