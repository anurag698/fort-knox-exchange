
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const MultiChartContext = createContext<{
  layout: string;
  updateLayout: (mode: string) => void;
  globalSymbol: string | null;
  setGlobalSymbol: (symbol: string | null) => void;
  globalInterval: string;
  setGlobalInterval: (interval: string) => void;
} | null>(null);

export function MultiChartProvider({ children, marketId }: { children: ReactNode, marketId: string }) {
  const [layout, setLayout] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("chartLayout") || "1"
      : "1"
  );

  const [globalSymbol, setGlobalSymbol] = useState<string | null>(marketId);
  const [globalInterval, setGlobalInterval] = useState("1m");

  useEffect(() => {
    setGlobalSymbol(marketId);
  }, [marketId]);

  const updateLayout = (mode: string) => {
    setLayout(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("chartLayout", mode);
    }
  };

  return (
    <MultiChartContext.Provider
      value={{
        layout,
        updateLayout,
        globalSymbol,
        setGlobalSymbol,
        globalInterval,
        setGlobalInterval,
      }}
    >
      {children}
    </MultiChartContext.Provider>
  );
}

export function useMultiChart() {
  const context = useContext(MultiChartContext);
  if (!context) {
    throw new Error("useMultiChart must be used within a MultiChartProvider");
  }
  return context;
}
