
"use client"

import { useMemo, useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, LineChart, BarChart } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { createChart, type CandlestickData, type IChartApi, type ISeriesApi, type Time, type LineData, type HistogramData } from "lightweight-charts";
import { getThemeColor, cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Candle = CandlestickData<Time> & { volume: number };

// Generates mock historical data. In a real app, this would be fetched from an API.
const generateMockCandles = (count: number, intervalSeconds: number): Candle[] => {
    const data: Candle[] = [];
    let lastClose = 70000 + (Math.random() - 0.5) * 2000;
    let currentTime = Math.floor(Date.now() / 1000) - count * intervalSeconds;
    currentTime = Math.floor(currentTime / intervalSeconds) * intervalSeconds;
    let lastVolume = 5 + Math.random() * 10;

    for (let i = 0; i < count; i++) {
        const open = lastClose + (Math.random() - 0.5) * 200;
        const high = Math.max(open, lastClose) + Math.random() * 300;
        const low = Math.min(open, lastClose) - Math.random() * 300;
        const close = low + Math.random() * (high - low);
        const volume = lastVolume * (1 + (Math.random() - 0.45)); // Fluctuate volume
        data.push({ time: currentTime as Time, open, high, low, close, volume });
        lastClose = close;
        lastVolume = volume;
        currentTime += intervalSeconds;
    }
    return data;
};

// A simplified WebSocket hook to get live prices
const useLivePrice = (symbol: string) => {
    const [price, setPrice] = useState<number | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
        
        ws.onopen = () => {
            console.log(`Connected to ${symbol} price stream.`);
            setError(null);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data && data.p) {
                setPrice(parseFloat(data.p));
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            setError(new Error("WebSocket connection failed."));
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed.");
        };

        return () => {
            ws.close();
        };

    }, [symbol]);

    return { price, error };
};


export function Charting() {
  const { price: btcPrice, error: pricesError } = useLivePrice('btcusdt');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interval, setInterval] = useState<string>("1m");

  const [showVolume, setShowVolume] = useState(true);
  const [showSma, setShowSma] = useState(true);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // State for live price display
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChangeDirection, setPriceChangeDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  const intervalSeconds = useMemo(() => {
    switch (interval) {
      case "1m": return 60;
      case "5m": return 300;
      case "1h": return 3600;
      default: return 60;
    }
  }, [interval]);

  const calculateSMA = (data: Candle[], period: number): LineData[] => {
    const sma: LineData[] = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
        sma.push({ time: data[i].time, value: sum / period });
    }
    return sma;
  };

  // Effect to initialize and manage the chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
        layout: {
            background: { color: 'transparent' },
            textColor: getThemeColor('foreground'),
        },
        grid: {
            vertLines: { color: getThemeColor('border') },
            horzLines: { color: getThemeColor('border') },
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: getThemeColor('border'),
        },
        rightPriceScale: {
            borderColor: getThemeColor('border'),
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
    });
    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
        upColor: getThemeColor('success'),
        downColor: getThemeColor('destructive'),
        borderDownColor: getThemeColor('destructive'),
        borderUpColor: getThemeColor('success'),
        wickDownColor: getThemeColor('destructive'),
        wickUpColor: getThemeColor('success'),
    });
    candlestickSeriesRef.current = candlestickSeries;

    const volumeSeries = chart.addHistogramSeries({
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '', // Attach to a separate y-axis scale
        lastValueVisible: false,
        priceLineVisible: false,
    });
    chart.priceScale('').applyOptions({
        scaleMargins: { top: 0.7, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    const smaSeries = chart.addLineSeries({
        color: '#FFD700', // Gold color for SMA line
        lineWidth: 2,
        lastValueVisible: false,
        priceLineVisible: false,
    });
    smaSeriesRef.current = smaSeries;

    const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
    };
}, []);

  // Effect to load initial data and handle interval changes
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const mockCandles = generateMockCandles(100, intervalSeconds);
      setCandles(mockCandles);
      if (mockCandles.length > 0) {
          setLastPrice(mockCandles[mockCandles.length - 1].close);
      }
      setIsLoading(false);
    }, 500);
  }, [interval, intervalSeconds]);

  // Effect to update chart series when data or visibility changes
  useEffect(() => {
    if (isLoading) return;
    
    candlestickSeriesRef.current?.setData(candles);

    if (showVolume) {
        const volumeData: HistogramData[] = candles.map(candle => ({
            time: candle.time,
            value: candle.volume,
            color: candle.close > candle.open ? 'rgba(0, 150, 136, 0.4)' : 'rgba(255, 82, 82, 0.4)',
        }));
        volumeSeriesRef.current?.setData(volumeData);
    } else {
        volumeSeriesRef.current?.setData([]);
    }

    if (showSma) {
        const smaData = calculateSMA(candles, 14); // 14-period SMA
        smaSeriesRef.current?.setData(smaData);
    } else {
        smaSeriesRef.current?.setData([]);
    }

  }, [candles, isLoading, showVolume, showSma]);

  // Effect to handle live price updates
  useEffect(() => {
    if (btcPrice === null || !candlestickSeriesRef.current || candles.length === 0) {
      return;
    }
    
    if (lastPrice !== null && btcPrice !== lastPrice) {
      setPriceChangeDirection(btcPrice > lastPrice ? 'up' : 'down');
    }
    setLastPrice(btcPrice);

    const lastCandle = candles[candles.length - 1];
    if (!lastCandle) return;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(currentTimestamp / intervalSeconds) * intervalSeconds;

    let updatedCandle: Candle;

    if (bucket === lastCandle.time) {
        updatedCandle = {
            ...lastCandle,
            high: Math.max(lastCandle.high, btcPrice),
            low: Math.min(lastCandle.low, btcPrice),
            close: btcPrice,
        };
        candlestickSeriesRef.current?.update(updatedCandle);
        setCandles(prev => [...prev.slice(0, -1), updatedCandle]);

    } else if (bucket > lastCandle.time) {
        updatedCandle = {
            time: bucket as Time,
            open: lastCandle.close,
            high: btcPrice,
            low: btcPrice,
            close: btcPrice,
            volume: 0, // Reset volume for the new candle
        };
        candlestickSeriesRef.current?.update(updatedCandle);
        setCandles(prev => [...prev, updatedCandle]);
    }
    
  }, [btcPrice, intervalSeconds, lastPrice, candles]);


  const renderContent = () => {
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
    // We render the container div, and the useEffect will populate it.
    // Show skeleton only during initial full load.
    return (
      <div className="relative">
          {isLoading && <Skeleton className="absolute inset-0 h-96 w-full" />}
          <div ref={chartContainerRef} className={cn(isLoading && "opacity-0")} />
      </div>
    );
  }

  const change24h = useMemo(() => {
    if (candles.length < 2) return 0;
    const currentPrice = candles[candles.length - 1].close;
    // Find a candle from approx 24 hours ago
    const now = Date.now() / 1000;
    const twentyFourHoursAgo = now - 24 * 3600;
    const oldCandle = candles.find(c => (c.time as number) >= twentyFourHoursAgo);
    const oldPrice = oldCandle?.open ?? candles[0].close;
    return ((currentPrice - oldPrice) / oldPrice) * 100;
  }, [candles]);

  const priceColor = priceChangeDirection === 'up' ? 'text-green-500' : priceChangeDirection === 'down' ? 'text-red-500' : 'text-foreground';
  const changeColor = change24h >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <Card className="flex-grow">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
                <div>
                    <CardTitle>BTC/USDT</CardTitle>
                    <CardDescription>Bitcoin / Tether</CardDescription>
                </div>
                <div>
                     <p className="text-sm text-muted-foreground">Last Price</p>
                    {(!lastPrice && isLoading) ? <Skeleton className="h-6 w-32 mt-1" /> : (
                        <p className={cn("text-2xl font-semibold transition-colors duration-200", priceColor)}>
                            {lastPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    )}
                </div>
                <div>
                     <p className="text-sm text-muted-foreground">24h Change</p>
                     <p className={cn("text-lg font-medium mt-1", changeColor)}>
                         {change24h.toFixed(2)}%
                    </p>
                </div>
            </div>
             <div className="flex items-center gap-4">
                <ToggleGroup type="single" defaultValue={interval} onValueChange={(value) => value && setInterval(value)} size="sm">
                    <ToggleGroupItem value="1m">1m</ToggleGroupItem>
                    <ToggleGroupItem value="5m">5m</ToggleGroupItem>
                    <ToggleGroupItem value="1h">1H</ToggleGroupItem>
                </ToggleGroup>
                <div className="flex items-center space-x-2">
                    <Checkbox id="sma-toggle" checked={showSma} onCheckedChange={(checked) => setShowSma(Boolean(checked))} />
                    <Label htmlFor="sma-toggle" className="text-sm font-medium flex items-center gap-1"><LineChart className="h-4 w-4" /> SMA</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="volume-toggle" checked={showVolume} onCheckedChange={(checked) => setShowVolume(Boolean(checked))} />
                    <Label htmlFor="volume-toggle" className="text-sm font-medium flex items-center gap-1"><BarChart className="h-4 w-4" /> Vol</Label>
                </div>
             </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
}
