
"use client";

import { useMultiChart } from "./multi-chart-provider";
import { ChartPane } from "./chart-pane";

export function MultiChartLayout() {
  const { layout } = useMultiChart();

  if (layout === "1") {
    return (
      <div className="w-full h-full">
        <ChartPane symbolOverride={undefined} />
      </div>
    );
  }

  if (layout === "2") {
    return (
      <div className="w-full h-full grid grid-cols-2 gap-1">
        <ChartPane symbolOverride={undefined} />
        <ChartPane symbolOverride={undefined} />
      </div>
    );
  }

  if (layout === "4") {
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
        <ChartPane symbolOverride={'BTC-USDT'} />
        <ChartPane symbolOverride={'ETH-USDT'} />
        <ChartPane symbolOverride={'SOL-USDT'} />
        <ChartPane symbolOverride={'DOGE-USDT'} />
      </div>
    );
  }

  return null;
}
