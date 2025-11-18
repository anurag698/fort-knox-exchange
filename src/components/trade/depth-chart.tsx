'use client';

import { createChart, ColorType, IChartApi, ISeriesApi, CrosshairMode } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';
import { useMarketDataStore, ProcessedOrder, RawOrder } from '@/lib/market-data-service';
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
      cumulative: roundQty(aCum, quantityPrecision),
    };
  });

  return { bidPoints, askPoints };
}



export default function DepthChart({ marketId }: { marketId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const bids = useMarketDataStore((s) => s.bids);
  const asks = useMarketDataStore((s) => s.asks);
  const ticker = useMarketDataStore((s) => s.ticker);
  const hoveredPrice = useMarketDataStore((s) => s.hoveredPrice);
  const { data: markets } = useMarkets();
  const market = markets?.find(m => m.id === marketId);

  const [midPrice, setMidPrice] = useState<number | null>(null);

  // Smooth animated zoom range
  const [animatedRange, setAnimatedRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 0,
  });

  // --------------------------------------------
  // Dynamic Price Range (Binance Spot Auto-Zoom)
  // --------------------------------------------
  function computeVisibleRange(
    bestBid: number,
    bestAsk: number,
    pricePrecision: number
  ) {
    if (!bestBid || !bestAsk || bestBid <= 0 || bestAsk <= 0) {
      return { min: 0, max: 0 };
    }

    const mid = (bestBid + bestAsk) / 2;
    const spread = bestAsk - bestBid;

    // Binance Spot: 4% padding
    const PAD = 0.04;

    const paddedMin = bestBid * (1 - PAD);
    const paddedMax = bestAsk * (1 + PAD);

    // Snap to market precision
    const min = floorPrice(paddedMin, pricePrecision);
    const max = ceilPrice(paddedMax, pricePrecision);

    return { min, max };
  }

  // ------------------------------------------
  // 1. Mid Price Calculation
  // ------------------------------------------
  useEffect(() => {
    if (!bids || !asks) return;

    const bestBid = bids.length ? bids[0].price : null;
    const bestAsk = asks.length ? asks[0].price : null;

    let derived = null;

    if (ticker?.c) {
      derived = parseFloat(ticker.c);
    } else if (bestBid && bestAsk) {
      derived = (bestBid + bestAsk) / 2;
    }

    setMidPrice(derived || null);
  }, [bids, asks, ticker]);

  // ------------------------------------------
  // 2. Chart Initialization
  // ------------------------------------------
  useEffect(() => {
    if (!containerRef.current || !market) return;

    if (!chartRef.current) {
      chartRef.current = createChart(containerRef.current, {
        layout: { background: { type: ColorType.Solid, color: '#0e0e0e' }, textColor: '#ccc' },
        grid: { vertLines: { color: '#1a1a1a' }, horzLines: { color: '#1a1a1a' } },
        height: 300,
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
      });

      (chartRef.current as any).bidSeries = (chartRef.current as IChartApi).addAreaSeries({
        lineColor: '#00b15d',
        topColor: 'rgba(0, 225, 115, 0.35)',
        bottomColor: 'rgba(0, 225, 115, 0.00)',
        lineWidth: 2,
      });

      (chartRef.current as any).askSeries = (chartRef.current as IChartApi).addAreaSeries({
        lineColor: '#d93f3f',
        topColor: 'rgba(255, 82, 82, 0.35)',
        bottomColor: 'rgba(255, 82, 82, 0.00)',
        lineWidth: 2,
      });
    }

    const chart = chartRef.current as any;
    
    const { bidPoints, askPoints } = buildCumulative(
      bids as RawOrder[],
      asks as RawOrder[],
      market.pricePrecision,
      market.quantityPrecision
    );

    chart.bidSeries.setData(bidPoints.map(p => ({ time: p.price, value: p.cumulative })));
    chart.askSeries.setData(askPoints.map(p => ({ time: p.price, value: p.cumulative })));


    const wallBids = bids.filter((b: any) => b.isWall);
    const wallAsks = asks.filter((a: any) => a.isWall);

    // Remove old wall markers
    containerRef.current.querySelectorAll('.depth-wall').forEach(e => e.remove());

    function createWallMarker(price: number, color: string) {
        const chart = chartRef.current as IChartApi;
        const el = containerRef.current;
        if (!el || !chart) return;
        const x = chart.timeScale().timeToCoordinate(price);
        if (x === null) return;

        const div = document.createElement('div');
        div.className = 'depth-wall';
        div.style.position = 'absolute';
        div.style.left = `${x - 2}px`;
        div.style.top = '0px';
        div.style.bottom = '0px';
        div.style.width = '4px';
        div.style.background = color;
        div.style.opacity = '0.4';
        div.style.boxShadow = `0 0 12px ${color}`;
        div.style.pointerEvents = 'none'; // Ensure it doesn't interfere with chart events
        el.appendChild(div);
    }

    wallBids.forEach((w: any) => createWallMarker(w.price, 'rgba(0,255,140,0.7)'));
    wallAsks.forEach((w: any) => createWallMarker(w.price, 'rgba(255,100,100,0.7)'));


  }, [bids, asks, market]);

  // ------------------------------------------
  // 3. Mid Price Line Overlay (HTML Layer)
  // ------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !midPrice || !chartRef.current || !market) return;

    const chart = chartRef.current as IChartApi;

    // Remove old line
    const oldLine = document.getElementById('mid-price-line');
    const oldLabel = document.getElementById('mid-price-label');
    if (oldLine) oldLine.remove();
    if (oldLabel) oldLabel.remove();

    // Convert price → pixel position
    const pixelX = chart.timeScale().timeToCoordinate(midPrice);

    if (pixelX === null) return;

    // Create vertical line element
    const line = document.createElement('div');
    line.id = 'mid-price-line';
    line.style.position = 'absolute';
    line.style.left = `${pixelX}px`;
    line.style.top = '0';
    line.style.bottom = '0';
    line.style.width = '1px';
    line.style.background = 'rgba(200,200,200,0.35)';
    line.style.pointerEvents = 'none';

    // Create label element
    const label = document.createElement('div');
    label.id = 'mid-price-label';
    label.innerText = midPrice.toFixed(market.pricePrecision);
    label.style.position = 'absolute';
    label.style.left = `${pixelX - 30}px`;
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

  }, [midPrice, market]);

  // ------------------------------------------
  // 4. Hover Sync: Detect hovered price
  // ------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chartRef.current) return;

    const chart = chartRef.current as IChartApi;

    function handleMove(param: any) {
        if (!param.point) return;
        const price = chart.timeScale().coordinateToTime(param.point.x);
        if (price === null) return;
        useMarketDataStore.getState().setHoveredPrice(price);
    }

    chart.subscribeCrosshairMove(handleMove);

    return () => chart.unsubscribeCrosshairMove(handleMove);
  }, []);

  // ---------------------------------------------------------
  // AUTO-ZOOM LISTENER (uses MarketDataService zoom events)
  // ---------------------------------------------------------
  useEffect(() => {
    const handler = () => {
      const store = useMarketDataStore.getState();
    
      const bids = store.bids;
      const asks = store.asks;
    
      if (!bids.length || !asks.length || !market) return;
    
      const bestBid = bids[0].price;
      const bestAsk = asks[0].price;
    
      const pricePrecision = market.pricePrecision ?? 2;
    
      const { min: targetMin, max: targetMax } = computeVisibleRange(bestBid, bestAsk, pricePrecision);
    
      // → Animated smoothing
      setAnimatedRange((prev) => {
        // Initialize if first run
        if (prev.min === 0 && prev.max === 0) {
            return { min: targetMin, max: targetMax };
        }
        const nextMin = ease(prev.min, targetMin, 0.20);
        const nextMax = ease(prev.max, targetMax, 0.20);
  
        return { min: nextMin, max: nextMax };
      });
    };
  
    window.addEventListener('depth:autoZoom', handler);
    // Initial zoom
    handler();
  
    return () => window.removeEventListener('depth:autoZoom', handler);
  }, [market]);

  // ---------------------------------------------
  // APPLY ANIMATED ZOOM TO CHART
  // ---------------------------------------------
  useEffect(() => {
    if (!chartRef.current) return;

    const { min, max } = animatedRange;
    if (!min || !max || min >= max) return;

    // Smooth stability: ignore micro-deltas
    if (nearlyEqual(min, max)) return;
    
    const timeScale = (chartRef.current as IChartApi).timeScale();
    if(timeScale) {
        timeScale.setVisibleRange({
            from: min,
            to: max,
        });
    }

  }, [animatedRange]);
  

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[300px] rounded-lg overflow-hidden bg-[#0d0d0d]"
    />
  );
}

    