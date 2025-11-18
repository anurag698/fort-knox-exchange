// This component renders the main trading chart using the Lightweight Charts library.
"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { IntervalBar } from "./interval-bar";

type Candle = { time: number; open: number; high: number; low: number; close: number; value: number };
type WSMsg = { stream: string; data: { k: { t: number, o: string, h: string, l: string, c: string, v: string, i: string } } };

const LightweightChart = ({ marketId, height = 550 }: { marketId: string; height?: number; }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [interval, setInterval] = useState("1m");

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: { background: { color: "#000000" }, textColor: "#d1d9e6" },
      grid: { vertLines: { color: "rgba(42, 46, 57, 0.5)" }, horzLines: { color: "rgba(42, 46, 57, 0.5)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#2a2e39" },
      timeScale: { borderColor: "#2a2e39" },
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a", downColor: "#ef5350", borderDownColor: "#ef5350",
      borderUpColor: "#26a69a", wickDownColor: "#ef5350", wickUpColor: "#26a69a",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a", priceFormat: { type: "volume" }, priceScaleId: "",
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    const ro = new ResizeObserver(() => chart.applyOptions({ width: containerRef.current!.clientWidth }));
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [height]);

  const loadHistoricalData = async (currentInterval: string) => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    const symbol = marketId.replace("-", "");
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${currentInterval}&limit=500`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const candleData = data.map((d: any) => ({
        time: d[0] / 1000, open: parseFloat(d[1]), high: parseFloat(d[2]),
        low: parseFloat(d[3]), close: parseFloat(d[4]),
      }));
      const volumeData = data.map((d: any) => ({
        time: d[0] / 1000, value: parseFloat(d[5]),
        color: parseFloat(d[4]) > parseFloat(d[1]) ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
      }));
      candleSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);
    } catch (err) {
      console.error("Failed to load historical candles", err);
    }
  };

  useEffect(() => {
    loadHistoricalData(interval);
  }, [marketId, interval]);

  useEffect(() => {
    const symbol = marketId.replace("-", "").toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);
    ws.onmessage = (event) => {
      const message: WSMsg = JSON.parse(event.data);
      const kline = message.data.k;
      const candle = {
        time: kline.t / 1000, open: parseFloat(kline.o), high: parseFloat(kline.h),
        low: parseFloat(kline.l), close: parseFloat(kline.c),
      };
      const volume = {
        time: kline.t / 1000, value: parseFloat(kline.v),
        color: parseFloat(kline.c) > parseFloat(kline.o) ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
      };
      candleSeriesRef.current?.update(candle);
      volumeSeriesRef.current?.update(volume);
    };
    return () => ws.close();
  }, [marketId, interval]);

  return (
    <div className="h-full w-full flex flex-col bg-card border rounded-lg">
      <IntervalBar currentInterval={interval} setInterval={setInterval} />
      <div ref={containerRef} className="flex-grow" />
    </div>
  );
};

export const MemoizedLightweightChart = memo(LightweightChart);
