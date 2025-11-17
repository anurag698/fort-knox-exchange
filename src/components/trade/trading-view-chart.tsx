'use client';

import React, { useEffect, useRef, memo } from 'react';
import { Button } from '../ui/button';
import { Maximize } from 'lucide-react';

interface TradingViewChartProps {
  marketId: string;
  setIsChartFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}

function TradingViewChart({ marketId, setIsChartFullscreen }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!container.current || !marketId) {
      return;
    }
    
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
    
  }, [marketId]);

  return (
    <div className="tradingview-widget-container relative" style={{ height: "550px", width: "100%" }}>
      <div id={`tradingview_chart_container_${marketId}`} ref={container} style={{ height: "100%", width: "100%" }}></div>
      <Button
          onClick={() => setIsChartFullscreen(true)}
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 xl:hidden"
          aria-label="Enter fullscreen chart"
      >
        <Maximize className="h-4 w-4" />
      </Button>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
            <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export const MemoizedTradingViewChart = memo(TradingViewChart);
export { TradingViewChart };
