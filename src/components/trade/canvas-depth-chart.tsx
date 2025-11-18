
'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { useMarketDataStore } from '@/lib/market-data-service';
import { useMarkets } from '@/hooks/use-markets';

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
  // Main draw loop (empty for now)
  // --------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = prepareCanvas();
    if (!ctx) return;

    // Background (temporary)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, dim.width, dim.height);

    // Debug text (will be removed in next batch)
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
  }, [prepareCanvas, dim, bids, asks, marketId, pricePrecision, quantityPrecision]);

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

  // --------------------------------------
  // Component output
  // --------------------------------------
  return (
    <div ref={parentRef} className="w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
