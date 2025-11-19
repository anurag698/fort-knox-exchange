// src/components/trade/pro-trading-layout.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import ResizeHandle from "@/components/ui/resize-handle";
import ResizeRowHandle from "@/components/ui/resize-row-handle";
import { useResizable } from "@/hooks/useResizable";
import OrderForm from "./orderform/order-form";
import OrderbookPanel from "./orderbook/orderbook-panel";
import TradesPanel from "./trades/trades-panel";
import MarketsSidebar from "./markets/markets-sidebar";
import PositionsPanel from "./positions/positions-panel";

const ProChart = dynamic(() => import("./chart/lightweight-pro-chart"), { ssr: false });

// Layout Wrapper
export default function ProTradingLayout({
  pair,
}: {
  pair: string;
}) {
  const { width: leftWidth, startResize: startResizeLeft } = useResizable(260);

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
        <MarketsSidebar />
      </div>

      {/* VERTICAL RESIZE HANDLE */}
      <ResizeHandle onMouseDown={startResizeLeft} />

      {/* CENTER PANEL */}
      <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
        <div className="flex-grow">
          <ProChart
            pair={pair}
            interval="1m"
            height={700}
          />
        </div>
        <div className="h-[300px] border-t border-bordercolor grid grid-cols-2 gap-4 p-4">
          <OrderbookPanel />
          <TradesPanel />
        </div>
      </div>


      {/* RIGHT PANEL */}
      <div className="w-[320px] border-l border-bordercolor p-4 grid grid-rows-2 gap-4">
        <div className="row-span-1">
            <h3 className="text-white mb-2 text-sm">Trade</h3>
            <OrderForm marketId={pair} />
        </div>
         <div className="row-span-1">
            <PositionsPanel />
        </div>
      </div>
    </div>
  );
}
