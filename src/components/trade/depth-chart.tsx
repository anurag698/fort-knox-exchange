'use client';

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { RawOrder } from '@/lib/types';

interface DepthChartProps {
  bids: RawOrder[];
  asks: RawOrder[];
}

export function DepthChart({ bids, asks }: DepthChartProps) {
  const { bidData, askData, midPrice, maxTotal } = useMemo(() => {
    
    // Sort asks ascending for cumulative calculation
    const sortedAsks = [...asks]
        .map(([price, quantity]) => ({ price: parseFloat(price), quantity: parseFloat(quantity) }))
        .sort((a, b) => a.price - b.price);

    // Sort bids descending
    const sortedBids = [...bids]
        .map(([price, quantity]) => ({ price: parseFloat(price), quantity: parseFloat(quantity) }))
        .sort((a, b) => b.price - a.price);

    let bidCumulative = 0;
    const bidPoints = sortedBids.map((o) => {
      bidCumulative += o.quantity;
      return {
        price: o.price,
        depth: bidCumulative,
      };
    });

    let askCumulative = 0;
    const askPoints = sortedAsks.map((o) => {
      askCumulative += o.quantity;
      return {
        price: o.price,
        depth: askCumulative,
      };
    });
    
    // Combine for a continuous x-axis, bids first (desc) then asks (asc)
    const combinedData = [...bidPoints.reverse(), ...askPoints];
    const maxDepth = Math.max(...combinedData.map(d => d.depth));

    const mid = sortedBids.length > 0 && sortedAsks.length > 0
      ? (sortedBids[0].price + sortedAsks[0].price) / 2
      : null;

    return { bidData: bidPoints, askData: askPoints, midPrice: mid, maxTotal: maxDepth };
  }, [bids, asks]);


  const chartConfig = {
      bids: { label: "Bids", color: "hsl(var(--chart-2))" },
      asks: { label: "Asks", color: "hsl(var(--chart-5))" },
  };

  return (
    <Card>
        <CardHeader className="p-4">
            <CardTitle className="text-lg">Market Depth</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
         <ChartContainer config={chartConfig} className="h-48 w-full">
            <AreaChart
                data={[...bidData.reverse(), ...askData]}
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
                <Tooltip
                    content={({ active, payload, label }) => (
                         <div className="p-2 bg-background/80 border rounded-md shadow-lg text-xs">
                            <p className="font-bold">Price: {label}</p>
                            {payload?.map((p, i) => (
                                <p key={i} style={{ color: p.color }}>
                                    {p.name === 'askDepth' ? 'Ask' : 'Bid'} Depth: {p.value}
                                </p>
                            ))}
                        </div>
                    )}
                />

                <defs>
                    <linearGradient id="fillBids" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-bids)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-bids)" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="fillAsks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-asks)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-asks)" stopOpacity={0.1}/>
                    </linearGradient>
                </defs>

                <Area
                    type="step"
                    data={bidData}
                    dataKey="depth"
                    stroke="hsl(var(--chart-2))"
                    fill="url(#fillBids)"
                    name="bidDepth"
                    strokeWidth={2}
                />
                 <Area
                    type="step"
                    data={askData}
                    dataKey="depth"
                    stroke="hsl(var(--chart-5))"
                    fill="url(#fillAsks)"
                    name="askDepth"
                    strokeWidth={2}
                />
            </AreaChart>
        </ChartContainer>
        </CardContent>
    </Card>
  );
}
