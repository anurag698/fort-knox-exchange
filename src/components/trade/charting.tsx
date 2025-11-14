"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
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
    label: "Price",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function Charting() {
  return (
    <Card className="flex-grow">
      <CardHeader>
        <CardTitle>BTC/USDT</CardTitle>
        <CardDescription>May 2024 Price History</CardDescription>
      </CardHeader>
      <CardContent>
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
              tickFormatter={(value) => `$${value / 1000}k`}
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
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
