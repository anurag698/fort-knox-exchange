// This component provides the time interval selection bar for the trading chart.
'use client';

import { Button } from "@/components/ui/button";

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

interface IntervalBarProps {
  currentInterval: string;
  setInterval: (interval: string) => void;
}

export function IntervalBar({ currentInterval, setInterval }: IntervalBarProps) {
  return (
    <div className="flex items-center gap-2 border-b p-2">
      {INTERVALS.map((interval) => (
        <Button
          key={interval}
          variant={currentInterval === interval ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setInterval(interval)}
        >
          {interval}
        </Button>
      ))}
    </div>
  );
}
