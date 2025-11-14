

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
import { AlertCircle, ChevronDown } from "lucide-react";
import { createChart, type CandlestickData, type IChartApi, type ISeriesApi, type Time, type LineData, type HistogramData } from "lightweight-charts";
import { getThemeColor, cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMarkets } from "@/hooks/use-markets";


type Candle = CandlestickData<Time> & { volume: number };

// A simplified WebSocket hook to get live prices
const useLivePrice = (symbol: string) => {
    const [price, setPrice] = useState<number | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!symbol) return;
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
        
        ws.onopen = () => {
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
        };

        return () => {
            ws.close();
        };

    }, [symbol]);

    return { price, error };
};


export function Charting({ marketId, setMarketId }: { marketId: string, setMarketId: (id: string) => void }) {
  const binanceSymbol = marketId.replace('-', '');
  const { price: livePrice, error: pricesError } = useLivePrice(binanceSymbol);
  const { data: markets, isLoading: marketsLoading } = useMarkets();
  
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interval, setInterval] = useState<string>("15m");

  const [showVolume, setShowVolume] = useState(true);
  const [showSma, setShowSma] = useState(true);
  const [showBbands, setShowBbands] = useState(true);
  const [showRsi, setShowRsi] = useState(true);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbandUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbandLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  const candlesRef = useRef(candles);
  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChangeDirection, setPriceChangeDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  const intervalMapping: { [key: string]: number } = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400,
  };
  const intervalSeconds = intervalMapping[interval] || 900; // Default to 15m

  const calculateSMA = (data: Candle[], period: number): LineData[] => {
    const sma: LineData[] = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
        sma.push({ time: data[i].time, value: sum / period });
    }
    return sma;
  };
  
  const calculateRSI = (data: Candle[], period: number = 14): LineData[] => {
    const rsi: LineData[] = [];
    if (data.length < period) return [];

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i-1].close;
        if(change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for(let i = period; i < data.length; i++) {
        const change = data[i].close - data[i-1].close;
        let gain = change > 0 ? change : 0;
        let loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        if (avgLoss === 0) {
            rsi.push({ time: data[i].time, value: 100 });
        } else {
            const rs = avgGain / avgLoss;
            rsi.push({ time: data[i].time, value: 100 - (100 / (1 + rs)) });
        }
    }
    return rsi;
  }
  
  const calculateBollingerBands = (data: Candle[], period: number = 20, stdDev: number = 2): { upper: LineData[], lower: LineData[] } => {
    const upper: LineData[] = [];
    const lower: LineData[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const sma = slice.reduce((acc, d) => acc + d.close, 0) / period;
        const variance = slice.reduce((acc, d) => acc + Math.pow(d.close - sma, 2), 0) / period;
        const sd = Math.sqrt(variance);
        
        upper.push({ time: data[i].time, value: sma + (sd * stdDev) });
        lower.push({ time: data[i].time, value: sma - (sd * stdDev) });
    }

    return { upper, lower };
  }

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
        height: 500,
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

    const volumeSeries = chart.addHistogramSeries({ priceScaleId: '' });
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
    volumeSeriesRef.current = volumeSeries;
    
    const rsiSeries = chart.addLineSeries({ priceScaleId: 'rsi', lastValueVisible: false, priceLineVisible: false });
    chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.8, bottom: 0.2 }});
    rsiSeriesRef.current = rsiSeries;

    const smaSeries = chart.addLineSeries({ color: 'rgba(255, 215, 0, 0.7)', lineWidth: 2, lastValueVisible: false, priceLineVisible: false });
    smaSeriesRef.current = smaSeries;

    const bbandUpper = chart.addLineSeries({ color: 'rgba(74, 222, 128, 0.5)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
    bbandUpperSeriesRef.current = bbandUpper;
    const bbandLower = chart.addLineSeries({ color: 'rgba(74, 222, 128, 0.5)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
    bbandLowerSeriesRef.current = bbandLower;


    const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
    };
  }, []);

  // Effect to load initial data and handle interval/market changes
  useEffect(() => {
    setIsLoading(true);
    const binanceInterval = interval.toLowerCase();
    fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=1000`)
        .then(res => res.json())
        .then(data => {
            const formattedCandles: Candle[] = data.map((d: any) => ({
                time: d[0] / 1000,
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
                volume: parseFloat(d[5]),
            }));
            setCandles(formattedCandles);
            if (formattedCandles.length > 0) {
                setLastPrice(formattedCandles[formattedCandles.length - 1].close);
            }
            setIsLoading(false);
        })
        .catch(err => {
            console.error(err);
            setIsLoading(false);
        });

  }, [interval, binanceSymbol]);

  // Effect to update chart series when data or visibility changes
  useEffect(() => {
    if (isLoading || !candles.length) return;
    
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
    
    if (showRsi) {
        const rsiData = calculateRSI(candles, 14);
        rsiSeriesRef.current?.setData(rsiData);
        chartRef.current?.priceScale('rsi').applyOptions({ visible: true });
    } else {
        rsiSeriesRef.current?.setData([]);
        chartRef.current?.priceScale('rsi').applyOptions({ visible: false });
    }

    if (showBbands) {
        const { upper, lower } = calculateBollingerBands(candles, 20, 2);
        bbandUpperSeriesRef.current?.setData(upper);
        bbandLowerSeriesRef.current?.setData(lower);
    } else {
        bbandUpperSeriesRef.current?.setData([]);
        bbandLowerSeriesRef.current?.setData([]);
    }


  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, isLoading, showVolume, showSma, showRsi, showBbands]);

  // Effect to handle live price updates
  useEffect(() => {
    if (livePrice === null || !candlestickSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    if (lastPrice !== null && livePrice !== lastPrice) {
      setPriceChangeDirection(livePrice > lastPrice ? 'up' : 'down');
    }
    setLastPrice(livePrice);

    const currentCandles = candlesRef.current;
    if (currentCandles.length === 0) return;
    
    const lastCandle = currentCandles[currentCandles.length - 1];
    if (!lastCandle) return;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const candleTimestamp = (lastCandle.time as number);
    const isNewCandle = currentTimestamp >= candleTimestamp + intervalSeconds;

    let updatedCandle: Candle;

    if (isNewCandle) {
        // Start a new candle
        updatedCandle = {
            time: (candleTimestamp + intervalSeconds) as Time,
            open: lastCandle.close,
            high: Math.max(lastCandle.close, livePrice),
            low: Math.min(lastCandle.close, livePrice),
            close: livePrice,
            volume: 0, // Volume for new candle starts at 0
        };
        const newCandles = [...currentCandles, updatedCandle];
        candlesRef.current = newCandles;
        candlestickSeriesRef.current?.update(updatedCandle);

    } else {
        // Update the current candle
        updatedCandle = {
            ...lastCandle,
            high: Math.max(lastCandle.high, livePrice),
            low: Math.min(lastCandle.low, livePrice),
            close: livePrice,
            // Volume would also be updated here if the stream provided it
        };
        const newCandles = [...currentCandles];
        newCandles[newCandles.length-1] = updatedCandle;
        candlesRef.current = newCandles;
        candlestickSeriesRef.current?.update(updatedCandle);
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrice, intervalSeconds, lastPrice]);


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
    return (
      <div className="relative">
          {(isLoading || marketsLoading) && <Skeleton className="absolute inset-0 h-[500px] w-full" />}
          <div ref={chartContainerRef} className={cn((isLoading || marketsLoading) && "opacity-0")} />
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

  const timeIntervals = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

  return (
    <Card className="flex-grow">
      <CardHeader>
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
                <div>
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-2xl font-semibold p-0 h-auto -ml-1">
                          {marketId.replace('-', '/')}
                          <ChevronDown className="h-5 w-5 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {markets?.map(market => (
                           <DropdownMenuItem key={market.id} onSelect={() => setMarketId(market.id)}>
                             {market.id.replace('-', '/')}
                           </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <CardDescription>Bitcoin / Tether</CardDescription>
                </div>
                <div className="flex items-baseline gap-6 text-right">
                     <div>
                        <p className="text-sm text-muted-foreground">24h Change</p>
                        <p className={cn("text-lg font-medium mt-1", changeColor)}>
                            {change24h.toFixed(2)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Last Price</p>
                        {(!lastPrice && isLoading) ? <Skeleton className="h-6 w-32 mt-1" /> : (
                            <p className={cn("text-2xl font-semibold transition-colors duration-200", priceColor)}>
                                {lastPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>
                </div>
            </div>
             <div className="flex items-center justify-between border-t pt-4">
                <ToggleGroup type="single" value={interval} onValueChange={(value) => value && setInterval(value)} size="sm">
                    {timeIntervals.map((item) => (
                        <ToggleGroupItem key={item} value={item} aria-label={`Select ${item} interval`}>
                           {item.toUpperCase()}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="sma-toggle" checked={showSma} onCheckedChange={(checked) => setShowSma(Boolean(checked))} />
                        <Label htmlFor="sma-toggle" className="text-xs font-medium flex items-center gap-1">SMA</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="volume-toggle" checked={showVolume} onCheckedChange={(checked) => setShowVolume(Boolean(checked))} />
                        <Label htmlFor="volume-toggle" className="text-xs font-medium flex items-center gap-1">Vol</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="bbands-toggle" checked={showBbands} onCheckedChange={(checked) => setShowBbands(Boolean(checked))} />
                        <Label htmlFor="bbands-toggle" className="text-xs font-medium flex items-center gap-1">BBands</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="rsi-toggle" checked={showRsi} onCheckedChange={(checked) => setShowRsi(Boolean(checked))} />
                        <Label htmlFor="rsi-toggle" className="text-xs font-medium flex items-center gap-1">RSI</Label>
                    </div>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {renderContent()}
      </CardContent>
    </Card>
  )
}
