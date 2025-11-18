// This component renders the tabs for switching between different trading modes.
'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type TradeMode = 'Advanced' | 'Chart' | 'Depth';

interface ModeSwitcherProps {
  activeMode: TradeMode;
  setMode: (mode: TradeMode) => void;
}

export function ModeSwitcher({ activeMode, setMode }: ModeSwitcherProps) {
  return (
    <Tabs value={activeMode} onValueChange={(value) => setMode(value as TradeMode)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-sm">
        <TabsTrigger value="Advanced">Advanced</TabsTrigger>
        <TabsTrigger value="Chart">Chart+TV</TabsTrigger>
        <TabsTrigger value="Depth">Depth</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
