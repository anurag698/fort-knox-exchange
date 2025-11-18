"use client";

import { useEffect } from "react";
import { useMultiChart } from "./multi-chart-provider";
import type { TradeMode } from "./mode-switcher";

interface HotkeysProps {
    toggleOrderPanel: () => void;
    goToChart: () => void;
    goToOrderbook: () => void;
}

export function Hotkeys({ toggleOrderPanel, goToChart, goToOrderbook }: HotkeysProps) {
  const { updateLayout } = useMultiChart();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "T") toggleOrderPanel();
      if (e.shiftKey && e.key === "C") goToChart();
      if (e.shiftKey && e.key === "O") goToOrderbook();

      if (e.key === "1") updateLayout("1");
      if (e.key === "2") updateLayout("2");
      if (e.key === "4") updateLayout("4");
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleOrderPanel, goToChart, goToOrderbook, updateLayout]);

  return null;
}
