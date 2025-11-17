'use client';

import { useState, useRef, type Dispatch, type SetStateAction } from 'react';
import { cn } from '@/lib/utils';

export type MobileTab = 'Orderbook' | 'Trades' | 'Depth' | 'Positions' | 'Alerts';
const TABS: MobileTab[] = ['Orderbook', 'Trades', 'Depth', 'Positions', 'Alerts'];

interface MobileTabsProps {
  activeTab: MobileTab;
  setActiveTab: Dispatch<SetStateAction<MobileTab>>;
}

export default function MobileTabs({ activeTab, setActiveTab }: MobileTabsProps) {
  const startX = useRef(0);
  const endX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    endX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const delta = endX.current - startX.current;

    if (Math.abs(delta) < 50) return; // Ignore small swipes

    const currentIndex = TABS.indexOf(activeTab);

    if (delta < 0) {
      // Swipe LEFT → next tab
      const nextIndex = Math.min(TABS.length - 1, currentIndex + 1);
      setActiveTab(TABS[nextIndex]);
    } else {
      // Swipe RIGHT → previous tab
      const prevIndex = Math.max(0, currentIndex - 1);
      setActiveTab(TABS[prevIndex]);
    }
  };

  return (
    <div
      className="xl:hidden w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex w-full border-b border-border text-sm bg-background/80">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-3 text-center transition-colors',
              activeTab === tab
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
