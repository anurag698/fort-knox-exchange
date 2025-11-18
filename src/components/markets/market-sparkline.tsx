"use client";

import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import { useSparkline } from "@/hooks/use-sparkline";

export function MarketSparkline({ marketId }: { marketId: string}) {
  const ref = useRef(null);
  const { data: points } = useSparkline(marketId);

  useEffect(() => {
    if (!ref.current || !points || points.length === 0) return;

    const chart = createChart(ref.current, {
      width: 100,
      height: 40,
      layout: {
        background: { color: "transparent" },
        textColor: "#aaa",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      timeScale: { visible: false },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      crosshair: { visible: false },
      handleScroll: false,
      handleScale: false,
    });

    const isUp = (points[0]?.value ?? 0) < (points[points.length-1]?.value ?? 0);

    const series = chart.addAreaSeries({
      lineColor: isUp ? "#22c55e" : "#ef4444",
      topColor: isUp ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
      bottomColor: "transparent",
      lineWidth: 2,
    });

    series.setData(points);
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [points]);

  return <div ref={ref} />;
}
