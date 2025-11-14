
"use client"

import { useMemo, useState, useEffect } from "react";
import {
  CandlestickChart,
  Candlestick,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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


type Candle = {
  time: number; // UNIX timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
};

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
        data.push({ time: currentTime, open, high, low, close });
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
      setCandles(generateMockCandles(100, intervalSeconds));
      setIsLoading(false);
    }, 500);
  }, [interval, intervalSeconds]);

  // Update candles with live prices
  useEffect(() => {
    if (btcPrice === undefined || candles.length === 0) {
      return;
    }

    const newPrice = btcPrice;
    const now = Date.now();
    const lastCandle = candles[candles.length - 1];

    // Determine the time bucket for the new price
    const bucket = Math.floor(now / 1000 / intervalSeconds) * intervalSeconds;

    setCandles(currentCandles => {
        const last = currentCandles[currentCandles.length - 1];

        if (bucket === last.time) {
            // Update the current candle
            const updatedLastCandle = {
                ...last,
                high: Math.max(last.high, newPrice),
                low: Math.min(last.low, newPrice),
                close: newPrice,
            };
            // Return a new array with the last candle updated
            return [...currentCandles.slice(0, -1), updatedLastCandle];
        } else {
            // Create a new candle
            const newCandle: Candle = {
                time: bucket,
                open: last.close,
                high: newPrice,
                low: newPrice,
                close: newPrice,
            };
            // Return a new array with the new candle appended
            return [...currentCandles, newCandle];
        }
    });

  }, [btcPrice, candles.length, intervalSeconds]);

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
    
    if(candles.length === 0){
       return (
         <div className="h-96 flex items-center justify-center text-muted-foreground">
          Waiting for chart data...
        </div>
      );
    }

    return (
       <ResponsiveContainer width="100%" height={400}>
          <CandlestickChart
            data={candles}
            margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={(time) => new Date(time * 1000).toLocaleTimeString()}
              minTickGap={80}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={['dataMin - 100', 'dataMax + 100']}
              tickFormatter={(price) => price.toLocaleString()}
              orientation="right"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))'
                }}
                labelFormatter={(time) => new Date(time * 1000).toLocaleString()}
            />
            <Candlestick
              dataKey="close"
              name="Candle"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--primary))"
              isAnimationActive={false}
            />
          </CandlestickChart>
        </ResponsiveContainer>
    );
  }

  const latestPrice = candles.length > 0 ? candles[candles.length-1].close : btcPrice;

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
