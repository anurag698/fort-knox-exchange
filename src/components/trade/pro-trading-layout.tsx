"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import ResizeHandle from "@/components/ui/resize-handle";
import ResizeRowHandle from "@/components/ui/resize-row-handle";
import { useResizable } from "@/hooks/useResizable";

const ProChart = dynamic(() => import("./lightweight-pro-chart"), { ssr: false });
const OrderBook = dynamic(() => import("./order-book"), { ssr: false });
const RecentTrades = dynamic(() => import("./recent-trades"), { ssr: false });
const OrderForm = dynamic(() => import("./order-form"), { ssr: false });

export default function ProTradingLayout({ pair, wsUrl }: { pair: string; wsUrl: string }) {
  const { width: leftWidth, startResize: startResizeLeft } = useResizable(900);

  const [obHeight, setObHeight] = useState(220);
  const [rtHeight, setRtHeight] = useState(220);
  const dragging = useRef<null | "ob" | "rt">(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragging.current === "ob") {
        setObHeight(Math.max(120, e.clientY - 160));
      }
      if (dragging.current === "rt") {
        setRtHeight(Math.max(120, e.clientY - (160 + obHeight + 16)));
      }
    };
    const up = () => (dragging.current = null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [obHeight, rtHeight]);

  return (
    <div className="w-full h-full flex overflow-hidden">
      
      {/* LEFT PANEL */}
      <div
        className="border-r border-[#1b2635] bg-[#0d1117]"
        style={{ width: leftWidth }}
      >
        <ProChart
          pair={pair}
          interval="1m"
          wsUrl={wsUrl}
          height={700}
          candlesApi={(p, i, f, t) =>
            `/api/marketdata/candles?pair=${p}&interval=${i}&from=${f}&to=${t}`
          }
        />
      </div>

      {/* VERTICAL RESIZE HANDLE */}
      <ResizeHandle onMouseDown={startResizeLeft} />

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">

        {/* ORDERBOOK */}
        <div
          className="border-b border-[#1b2635] p-4 overflow-auto"
          style={{ height: obHeight }}
        >
          <h3 className="text-white mb-2 text-sm">Order Book</h3>
          <OrderBook marketId={pair} />
        </div>

        {/* ROW HANDLE */}
        <ResizeRowHandle onMouseDown={() => (dragging.current = "ob")} />

        {/* RECENT TRADES */}
        <div
          className="border-b border-[#1b2635] p-4 overflow-auto"
          style={{ height: rtHeight }}
        >
          <h3 className="text-white mb-2 text-sm">Recent Trades</h3>
          <RecentTrades marketId={pair} />
        </div>

        {/* ROW HANDLE */}
        <ResizeRowHandle onMouseDown={() => (dragging.current = "rt")} />

        {/* ORDER FORM */}
        <div className="p-4 flex-1 overflow-auto">
          <h3 className="text-white mb-2 text-sm">Trade</h3>
          <OrderForm marketId={pair} />
        </div>
      </div>
    </div>
  );
}
