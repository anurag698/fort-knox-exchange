"use client";

import { useState } from "react";

const store: any = {
  sma5: true,
  sma20: true,
  ema20: false,
  ema50: false,
  rsi: false,
  bb: false,
};

export function useChartIndicator(key: string): [boolean, (v: boolean) => void] {
  const [val, setVal] = useState(store[key]);

  const update = (v: boolean) => {
    store[key] = v;
    setVal(v);
  };

  return [val, update];
}

export function getIndicatorState(key: string) {
  return store[key];
}
