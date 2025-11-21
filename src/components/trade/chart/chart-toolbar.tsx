
// src/components/trade/chart/chart-toolbar-enhanced.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Square,
  Type,
  Settings,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Home,
  Undo2,
  Trash2,
  Magnet,
  ArrowUpRight,
  Ruler,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useChartContext } from "../trading-chart-container";

type Interval = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D";
type ChartType = "candlestick" | "line" | "area" | "heikin_ashi";
type DrawingTool = "trend" | "horizontal" | "fib" | "ray" | "measure";

interface ChartToolbarProps {
  selectedInterval: Interval;
  onIntervalChange: (interval: Interval) => void;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  engineAPI?: any; // Optional prop for cases without context
}

export function ChartToolbar({
  selectedInterval,
  onIntervalChange,
  chartType,
  onChartTypeChange,
  engineAPI: propEngineAPI
}: ChartToolbarProps) {
  // Get context if available (returns null if not in provider)
  const context = useChartContext();

  // Use context values if available, otherwise use defaults/props
  const engineAPI = context?.engineAPI || propEngineAPI || (typeof window !== 'undefined' ? (window as any).__FK_CHART__ : null);

  // Use context state for indicators if available, else local (fallback)
  const [localActiveIndicators, setLocalActiveIndicators] = useState<Set<string>>(new Set());
  const activeIndicators = context?.activeIndicators ?? localActiveIndicators;
  const setActiveIndicators = context?.setActiveIndicators ?? setLocalActiveIndicators;

  console.log("[ChartToolbar] Render", {
    hasContext: !!context,
    hasPropEngine: !!propEngineAPI,
    hasResolvedEngine: !!engineAPI,
    engineUI: !!engineAPI?.engine?.ui,
    chartType
  });

  const timeframes: Interval[] = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"];
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool | null>(null);
  const [isMagnetActive, setIsMagnetActive] = useState(false);

  const indicatorsRef = useRef<HTMLDivElement>(null);
  const chartTypeRef = useRef<HTMLDivElement>(null);

  // Track if we've restored state to avoid double-application
  const restoredStateRef = useRef(false);

  // Reset restoration flag when engine changes (e.g. chart type switch)
  useEffect(() => {
    restoredStateRef.current = false;
  }, [engineAPI]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (indicatorsRef.current && !indicatorsRef.current.contains(event.target as Node)) {
        setShowIndicators(false);
      }
      if (chartTypeRef.current && !chartTypeRef.current.contains(event.target as Node)) {
        setShowChartTypeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const drawingTools = [
    { id: "trend" as DrawingTool, icon: TrendingUp, label: "Trend Line" },
    { id: "horizontal" as DrawingTool, icon: Minus, label: "Horizontal Line" },
    { id: "fib" as DrawingTool, icon: TrendingDown, label: "Fibonacci" },
  ];

  const indicators = [
    { id: "sma20", label: "SMA 20", action: () => engineAPI?.engine?.ui?.addSMA?.(20, "#f6e05e"), remove: () => engineAPI?.engine?.ui?.removeSMA?.(20) },
    { id: "sma50", label: "SMA 50", action: () => engineAPI?.engine?.ui?.addSMA?.(50, "#fb923c"), remove: () => engineAPI?.engine?.ui?.removeSMA?.(50) },
    { id: "ema12", label: "EMA 12", action: () => engineAPI?.engine?.ui?.addEMA?.(12, "#fb7185"), remove: () => engineAPI?.engine?.ui?.removeEMA?.(12) },
    { id: "ema26", label: "EMA 26", action: () => engineAPI?.engine?.ui?.addEMA?.(26, "#c084fc"), remove: () => engineAPI?.engine?.ui?.removeEMA?.(26) },
    { id: "vwap", label: "VWAP", action: () => engineAPI?.engine?.ui?.addVWAP?.("today"), remove: () => engineAPI?.engine?.ui?.removeVWAP?.("today") },
    { id: "bb20", label: "Bollinger Bands", action: () => engineAPI?.engine?.ui?.addBB?.(20, 2), remove: () => engineAPI?.engine?.ui?.removeBB?.(20, 2) },
    { id: "macd", label: "MACD", action: () => engineAPI?.engine?.ui?.addMACD?.(12, 26, 9), remove: () => engineAPI?.engine?.ui?.removeMACD?.(12, 26, 9) },
  ];

  // Auto-restore indicators when engine becomes ready
  useEffect(() => {
    if (engineAPI?.engine?.ui && activeIndicators.size > 0 && !restoredStateRef.current) {
      console.log("[ChartToolbar] Restoring active indicators:", Array.from(activeIndicators));
      activeIndicators.forEach(id => {
        const ind = indicators.find(i => i.id === id);
        if (ind) {
          try {
            ind.action();
          } catch (e) {
            console.warn(`Failed to restore indicator ${id} `, e);
          }
        }
      });
      restoredStateRef.current = true;
    }
  }, [engineAPI, activeIndicators]);

  const handleIndicatorToggle = (indicatorId: string, action: () => void, removeAction?: () => void) => {
    const newSet = new Set(activeIndicators);
    if (newSet.has(indicatorId)) {
      newSet.delete(indicatorId);
      console.log(`[Toolbar] Removing indicator: ${indicatorId} `);
      if (removeAction) {
        removeAction();
      }
    } else {
      newSet.add(indicatorId);
      console.log(`[Toolbar] Adding indicator: ${indicatorId} `);
      action();
    }
    setActiveIndicators(newSet);
  };

  const handleDrawingTool = (toolId: string) => {
    if (activeDrawingTool === toolId) {
      setActiveDrawingTool(null);
      engineAPI?.engine?.ui?.enableFreeDraw?.(); // or cancel
      return;
    }

    setActiveDrawingTool(toolId as DrawingTool); // Cast to DrawingTool as it's one of the defined tools
    console.log(`[Toolbar] Activating drawing tool: ${toolId} `);

    if (toolId === "trend") {
      engineAPI?.engine?.ui?.enableTrendTool?.();
    } else if (toolId === "ray") {
      engineAPI?.engine?.ui?.enableRayTool?.();
    } else if (toolId === "measure") {
      engineAPI?.engine?.ui?.enableMeasureTool?.();
    } else if (toolId === "undo") {
      engineAPI?.engine?.ui?.undoDrawing?.();
    } else if (toolId === "clear") {
      engineAPI?.engine?.ui?.clearDrawings?.();
    } else if (toolId === "horizontal") {
      // Horizontal line drawing
      console.log("Horizontal line tool activated");
      engineAPI?.engine?.ui?.enableHorizontalTool?.();
    } else if (toolId === "fib") {
      // Fibonacci drawing
      console.log("Fibonacci tool activated");
      engineAPI?.engine?.ui?.enableFibTool?.();
    }
  };

  const handleZoomIn = () => {
    engineAPI?.engine?.ui?.zoomIn?.();
  };

  const handleZoomOut = () => {
    engineAPI?.engine?.ui?.zoomOut?.();
  };

  const handleResetZoom = () => {
    engineAPI?.engine?.ui?.resetZoom?.();
  };

  const handleClearDrawings = () => {
    engineAPI?.engine?.ui?.clearDrawings?.();
    setActiveDrawingTool(null);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Top Toolbar - Timeframes and Chart Controls */}
      <div className="absolute top-0 left-0 right-0 h-10 flex items-center gap-2 px-3 pointer-events-auto bg-card/80 backdrop-blur-sm border-b border-border/50">

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              size="sm"
              variant={selectedInterval === tf ? "default" : "ghost"}
              className={`h - 7 px - 3 text - xs font - medium transition - all duration - 200 ${selectedInterval === tf
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                } `}
              onClick={() => onIntervalChange(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Chart Type Dropdown */}
        <div className="relative" ref={chartTypeRef}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs gap-1 transition-colors duration-200"
            onClick={() => setShowChartTypeMenu(!showChartTypeMenu)}
          >
            <span className="capitalize">{chartType}</span>
            <ChevronDown className="w-3 h-3" />
          </Button>

          {showChartTypeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[120px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                className={`w - full px - 3 py - 1.5 text - xs text - left hover: bg - accent capitalize transition - colors ${chartType === "candlestick" ? "bg-accent" : ""
                  } `}
                onClick={() => {
                  onChartTypeChange("candlestick");
                  setShowChartTypeMenu(false);
                }}
              >
                Candlestick
              </button>
              <button
                className={`w - full px - 3 py - 1.5 text - xs text - left hover: bg - accent capitalize transition - colors ${chartType === "heikin_ashi" ? "bg-accent" : ""
                  } `}
                onClick={() => {
                  onChartTypeChange("heikin_ashi");
                  setShowChartTypeMenu(false);
                }}
              >
                Heikin Ashi
              </button>
              <button
                className={`w - full px - 3 py - 1.5 text - xs text - left hover: bg - accent capitalize transition - colors ${chartType === "line" ? "bg-accent" : ""
                  } `}
                onClick={() => {
                  onChartTypeChange("line");
                  setShowChartTypeMenu(false);
                }}
              >
                Line
              </button>
              <button
                className={`w - full px - 3 py - 1.5 text - xs text - left hover: bg - accent capitalize transition - colors ${chartType === "area" ? "bg-accent" : ""
                  } `}
                onClick={() => {
                  onChartTypeChange("area");
                  setShowChartTypeMenu(false);
                }}
              >
                Area
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Indicators Dropdown */}
        <div className="relative" ref={indicatorsRef}>
          <Button
            size="sm"
            variant="ghost"
            className={`h - 7 px - 3 text - xs gap - 1 transition - colors duration - 200 ${activeIndicators.size > 0 ? "text-primary" : ""
              } `}
            onClick={() => setShowIndicators(!showIndicators)}
          >
            Indicators
            {activeIndicators.size > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                {activeIndicators.size}
              </span>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>

          {showIndicators && (
            <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[140px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {indicators.map((indicator) => (
                <button
                  key={indicator.id}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent flex items-center gap-2 transition-colors"
                  onClick={() => handleIndicatorToggle(indicator.id, indicator.action, indicator.remove)}
                >
                  <input
                    type="checkbox"
                    checked={activeIndicators.has(indicator.id)}
                    onChange={() => { }}
                    className="w-3 h-3 rounded border-border"
                  />
                  {indicator.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Zoom Controls */}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 transition-colors duration-200"
          title="Zoom In"
          onClick={handleZoomIn}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 transition-colors duration-200"
          title="Zoom Out"
          onClick={handleZoomOut}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 transition-colors duration-200"
          title="Reset Zoom"
          onClick={handleResetZoom}
        >
          <Home className="w-3.5 h-3.5" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Settings */}
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Left Toolbar - Drawing Tools */}
      <div className="absolute left-2 top-12 flex flex-col gap-1 pointer-events-auto">
        {drawingTools.map((tool) => (
          <Button
            key={tool.id}
            size="sm"
            variant="ghost"
            className={`h - 8 w - 8 p - 0 bg - card / 80 backdrop - blur - sm border border - border / 50 hover: bg - accent transition - all duration - 200 ${activeDrawingTool === tool.id ? "bg-primary text-primary-foreground border-primary" : ""
              } `}
            title={tool.label}
            onClick={() => handleDrawingTool(tool.id)}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
        <Button
          variant={activeDrawingTool === "ray" ? "default" : "ghost"}
          size="icon"
          onClick={() => handleDrawingTool("ray")}
          title="Ray"
          className={`h - 8 w - 8 p - 0 bg - card / 80 backdrop - blur - sm border border - border / 50 hover: bg - accent transition - all duration - 200 ${activeDrawingTool === "ray" ? "bg-primary text-primary-foreground border-primary" : ""
            } `}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Button>
        <Button
          variant={activeDrawingTool === "measure" ? "default" : "ghost"}
          size="icon"
          onClick={() => handleDrawingTool("measure")}
          title="Measure"
          className={`h - 8 w - 8 p - 0 bg - card / 80 backdrop - blur - sm border border - border / 50 hover: bg - accent transition - all duration - 200 ${activeDrawingTool === "measure" ? "bg-primary text-primary-foreground border-primary" : ""
            } `}
        >
          <Ruler className="h-4 w-4" />
        </Button>

        {/* Magnet Mode */}
        <Button
          size="sm"
          variant="ghost"
          className={`h - 8 w - 8 p - 0 bg - card / 80 backdrop - blur - sm border border - border / 50 hover: bg - accent transition - all duration - 200 mt - 2 ${isMagnetActive ? "text-primary border-primary bg-accent" : ""
            } `}
          title="Toggle Magnet Mode"
          onClick={() => {
            const isActive = engineAPI?.engine?.ui?.toggleMagnet?.();
            setIsMagnetActive(!!isActive);
          }}
        >
          <Magnet className="w-4 h-4" />
        </Button>

        {/* Undo / Clear Actions */}
        <div className="mt-2 flex flex-col gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-accent transition-all duration-200"
            title="Undo Last Drawing"
            onClick={() => handleDrawingTool("undo" as any)}
          >
            <Undo2 className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="destructive"
            className="h-8 w-8 p-0 bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-destructive/90 transition-all duration-200"
            title="Clear All Drawings"
            onClick={handleClearDrawings}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

