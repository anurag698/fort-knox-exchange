"use client";
import { useRef, useState, useEffect } from "react";

export function useResizable(defaultWidth: number) {
  const [width, setWidth] = useState(defaultWidth);
  const ref = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !ref.current) return;
      const newWidth = e.clientX;
      setWidth(Math.max(280, Math.min(newWidth, window.innerWidth - 300)));
    };

    const onUp = () => (isDragging.current = false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startResize = () => {
    isDragging.current = true;
  };

  return { width, ref, startResize };
}
