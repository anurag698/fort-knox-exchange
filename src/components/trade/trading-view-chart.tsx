'use client';

import React, { useEffect, useRef, memo } from 'react';

function TradingViewChart({ marketId }: { marketId: string }) {
  const container = useRef<HTMLDivElement>(null);
  
  // Use a key on the outer div to force re-mounting when marketId changes
  // This is the simplest and most reliable way to handle the TradingView library.
  
  useEffect(() => {
    // This effect now only runs when the component mounts.
    // The key change will handle re-initialization.
    if (container.current) {
        // Clear any previous widget
        container.current.innerHTML = '';
        
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.type = "text/javascript";
        script.async = true;
        script.onload = () => {
            if (typeof (window as any).TradingView !== 'undefined') {
                new (window as any).TradingView.widget({
                    autosize: true,
                    symbol: `BINANCE:${marketId.replace('-', '')}`,
                    interval: "D",
                    timezone: "Etc/UTC",
                    theme: "dark",
                    style: "1",
                    locale: "en",
                    enable_publishing: false,
                    withdateranges: true,
                    hide_side_toolbar: false,
                    allow_symbol_change: true,
                    details: true,
                    hotlist: true,
                    calendar: true,
                    container_id: container.current?.id,
                });
            }
        };
        container.current.appendChild(script);
    }
  }, [marketId]);

  return (
    <div className="tradingview-widget-container" style={{ height: "550px", width: "100%" }}>
      <div id={`tradingview_chart_container_${marketId}`} ref={container} style={{ height: "100%", width: "100%" }}></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
            <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

// Memoize the component to prevent re-renders when parent state changes, unless marketId changes.
export const MemoizedTradingViewChart = memo(TradingViewChart);
export { TradingViewChart };
