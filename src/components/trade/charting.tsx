
"use client"

import { useMemo } from "react";
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

const initialChartData = [
  { date: "2024-05-01", price: 63500 },
  { date: "2024-05-02", price: 62800 },
  { date: "2024-05-03", price: 64100 },
  { date: "2024-05-04", price: 63900 },
  { date: "2024-05-05", price: 65200 },
  { date: "2024-05-06", price: 66100 },
  { date: "2024-05-07", price: 65500 },
  { date: "2024-05-08", price: 67000 },
  { date: "2024-05-09", price: 67800 },
  { date: "2024-05-10", price: 68500 },
  { date: "2024-05-11", price: 69200 },
  { date: "2024-05-12", price: 68800 },
  { date: "2024-05-13", price: 70100 },
  { date: "2024-05-14", price: 71200 },
  { date: "2024-05-15", price: 70500 },
]

const chartConfig = {
  price: {
    label: "Price (USDT)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function Charting() {
  const { data: prices, isLoading, error } = usePrices();
  const btcPrice = prices?.['BTC'];

  const chartData = useMemo(() => {
    if (!btcPrice) return initialChartData;
    const newData = [...initialChartData];
    // Replace the last point with the live price
    newData[newData.length - 1] = {
      date: new Date().toISOString().split('T')[0],
      price: btcPrice,
    };
    return newData;
  }, [btcPrice]);


  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-96 w-full" />;
    }

    if (error) {
      return (
        <div className="h-96 flex items-center justify-center text-muted-foreground">
          Error loading price chart.
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
            }}
          >
            <CartesianGrid vertical={false} />
             <YAxis
              dataKey="price"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                 const date = new Date(value)
                 return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                 })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
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


  return (
    <Card className="flex-grow">
      <CardHeader>
        <CardTitle>BTC/USDT</CardTitle>
        {isLoading && <CardDescription>Fetching live price...</CardDescription>}
        {btcPrice && !isLoading && <CardDescription>Live Price: ${btcPrice.toLocaleString()}</CardDescription>}
        {!isLoading && !btcPrice && <CardDescription>Price data unavailable</CardDescription>}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
}
