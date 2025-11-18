"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function FloatingOrderPanel({ children }: { children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 60, y: 120 };

    const saved = localStorage.getItem("orderPanelPos");
    return saved ? JSON.parse(saved) : { x: 60, y: 120 };
  });

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging) return;
      setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }

    function onUp() {
      if (dragging) {
        setDragging(false);
        localStorage.setItem("orderPanelPos", JSON.stringify(position));
      }
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, offset, position]);

  return (
    <div
      ref={panelRef}
      style={{ left: position.x, top: position.y }}
      className={cn(
        "fixed z-50 w-[330px] bg-[#101216] border border-neutral-700 rounded shadow-lg",
        "transition-all select-none"
      )}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="cursor-move px-3 py-2 bg-[#1d2024] text-neutral-300 text-sm border-b border-neutral-700"
      >
        Trading Panel
      </div>

      {/* Panel Content */}
      <div className="p-3">{children}</div>
    </div>
  );
}
