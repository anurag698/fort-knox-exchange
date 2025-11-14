
"use client"

import { useMemo, useState, useEffect } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { usePrices } from "@/hooks/use-prices";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";

type ChartDataPoint = {
  time: string;
  price: number;
};

const chartConfig = {
  price: {
    label: "Price (USDT)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const MAX_DATA_POINTS = 30; // Keep the last 30 data points for a rolling window

export function Charting() {
  const { data: prices, isLoading: pricesLoading, error: pricesError } = usePrices();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const btcPrice = prices?.['BTC'];

  useEffect(() => {
    if (btcPrice !== undefined) {
      const now = new Date();
      const newPoint: ChartDataPoint = {
        time: now.toLocaleTimeString(),
        price: btcPrice,
      };

      setChartData(prevData => {
        const newData = [...prevData, newPoint];
        // Keep only the last MAX_DATA_POINTS
        if (newData.length > MAX_DATA_POINTS) {
          return newData.slice(newData.length - MAX_DATA_POINTS);
        }
        return newData;
      });
    }
  }, [btcPrice]); // This effect runs every time btcPrice changes

  const renderContent = () => {
    // Show skeleton if prices are loading for the first time AND there's no chart data yet
    if (pricesLoading && chartData.length === 0) {
      return <Skeleton className="h-96 w-full" />;
    }

    if (pricesError && chartData.length === 0) {
      return (
        <div className="h-96 flex items-center justify-center text-muted-foreground">
          Error loading price chart.
        </div>
      );
    }
    
    if(chartData.length === 0){
       return (
         <div className="h-96 flex items-center justify-center text-muted-foreground">
          Waiting for live price data...
        </div>
      );
    }

    return (
       <ChartContainer config={chartConfig} className="h-96 w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid vertical={false} />
             <YAxis
              dataKey="price"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" labelKey="time" />}
            />
            <Line
              dataKey="price"
              type="monotone"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
    );
  }

  const latestPrice = chartData.length > 0 ? chartData[chartData.length-1].price : btcPrice;

  return (
    <Card className="flex-grow">
      <CardHeader>
        <CardTitle>BTC/USDT</CardTitle>
        {(pricesLoading && !latestPrice) && <CardDescription>Fetching live price...</CardDescription>}
        {latestPrice && <CardDescription>Live Price: ${latestPrice.toLocaleString()}</CardDescription>}
        {(!pricesLoading && !latestPrice) && <CardDescription>Price data unavailable</CardDescription>}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
}
