
"use client"

import { useMemo, useState, useEffect, useRef } from "react";
import { usePrices } from "@/hooks/use-prices";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LightweightChart } from "@/components/ui/lightweight-chart";
import { type CandlestickData, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";

type Candle = CandlestickData<Time>;

// Mock function to generate historical data
const generateMockCandles = (count: number, intervalSeconds: number): Candle[] => {
    const data: Candle[] = [];
    let lastClose = 70000 + (Math.random() - 0.5) * 2000;
    let currentTime = Math.floor(Date.now() / 1000) - count * intervalSeconds;

    for (let i = 0; i < count; i++) {
        const open = lastClose;
        const high = open + Math.random() * 500;
        const low = open - Math.random() * 500;
        const close = low + Math.random() * (high - low);
        data.push({ time: currentTime as Time, open, high, low, close });
        lastClose = close;
        currentTime += intervalSeconds;
    }
    return data;
};


export function Charting() {
  const { data: prices, isLoading: pricesLoading, error: pricesError } = usePrices();
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interval, setInterval] = useState<string>("1m");
  const btcPrice = prices?.['BTC'];
  
  const chartRef = useRef<IChartApi>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'>>(null);

  const intervalSeconds = useMemo(() => {
    switch (interval) {
      case "1m": return 60;
      case "5m": return 300;
      case "1h": return 3600;
      default: return 60;
    }
  }, [interval]);

  // Fetch initial historical data
  useEffect(() => {
    setIsLoading(true);
    // In a real app, this would be a fetch call to /api/markets/BTC-USDT/candles?interval=...
    // We simulate it with mock data for now.
    setTimeout(() => {
      const mockCandles = generateMockCandles(100, intervalSeconds);
      setCandles(mockCandles);
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(mockCandles);
      }
      setIsLoading(false);
    }, 500);
  }, [interval, intervalSeconds]);

  // Update candles with live prices
  useEffect(() => {
    if (btcPrice === undefined || !candlestickSeriesRef.current) {
      return;
    }

    const newPrice = btcPrice;
    const now = Date.now();
    const lastCandle = candles[candles.length - 1];
    
    // lightweight-charts works with UTC timestamps, so we need to adjust
    const currentTimestamp = Math.floor(now / 1000);

    const bucket = Math.floor(currentTimestamp / intervalSeconds) * intervalSeconds;

    if (!lastCandle || !candlestickSeriesRef.current) return;

    if (bucket === lastCandle.time) {
        // Update the current candle
        const updatedCandle = {
            ...lastCandle,
            high: Math.max(lastCandle.high, newPrice),
            low: Math.min(lastCandle.low, newPrice),
            close: newPrice,
        };
        candlestickSeriesRef.current.update(updatedCandle);
        // Also update our local state
        setCandles(prev => [...prev.slice(0, -1), updatedCandle]);
    } else if (bucket > lastCandle.time) {
        // Create a new candle
        const newCandle: Candle = {
            time: bucket as Time,
            open: lastCandle.close,
            high: newPrice,
            low: newPrice,
            close: newPrice,
        };
        candlestickSeriesRef.current.update(newCandle);
        setCandles(prev => [...prev, newCandle]);
    }

  }, [btcPrice, candles, intervalSeconds]);


  const chartOptions = {
    layout: {
      background: { color: 'transparent' },
      textColor: 'hsl(var(--muted-foreground))',
    },
    grid: {
      vertLines: { color: 'hsl(var(--border))' },
      horzLines: { color: 'hsl(var(--border))' },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
    },
  };

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-96 w-full" />;
    }

    if (pricesError) {
      return (
        <div className="h-96 flex items-center justify-center">
            <Alert variant="destructive" className="w-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Prices</AlertTitle>
                <AlertDescription>
                    Could not fetch live price data. The chart will not update.
                </AlertDescription>
            </Alert>
        </div>
      );
    }

    return (
      <LightweightChart 
        options={chartOptions}
        candlestickSeriesOptions={{
            upColor: '#10b981',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#10b981',
            wickDownColor: '#ef4444',
            wickUpColor: '#10b981',
        }}
        initialData={candles}
        onChartReady={(chart, series) => {
            chartRef.current = chart;
            candlestickSeriesRef.current = series;
        }}
        height={400}
      />
    );
  }

  const latestPrice = btcPrice ?? (candles.length > 0 ? candles[candles.length - 1].close : undefined);

  return (
    <Card className="flex-grow">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>BTC/USDT</CardTitle>
                 {(pricesLoading && !latestPrice) && <CardDescription>Fetching live price...</CardDescription>}
                {latestPrice && <CardDescription>Live Price: ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CardDescription>}
                {(!pricesLoading && !latestPrice && !pricesError) && <CardDescription>Price data unavailable</CardDescription>}
                 {pricesError && <CardDescription className="text-destructive">Price feed error</CardDescription>}
            </div>
             <ToggleGroup type="single" defaultValue={interval} onValueChange={(value) => value && setInterval(value)} size="sm">
                <ToggleGroupItem value="1m">1m</ToggleGroupItem>
                <ToggleGroupItem value="5m">5m</ToggleGroupItem>
                <ToggleGroupItem value="1h">1H</ToggleGroupItem>
            </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
}
