
"use client";

import { useMemo } from "react";
import { TrendingUp, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

type PortfolioItem = {
    id: string;
    asset: { symbol: string, name: string };
    available: number;
    value: number;
};

type PortfolioOverviewProps = {
  data: PortfolioItem[];
};

export function PortfolioOverview({ data }: PortfolioOverviewProps) {
    const { totalValue, chartData, chartConfig } = useMemo(() => {
        const totalValue = data.reduce((sum, item) => sum + item.value, 0);

        const chartData = data
        .filter(item => item.value > 0)
        .map(item => ({
            asset: item.asset.symbol,
            value: item.value,
            fill: `hsl(var(--chart-${(data.indexOf(item) % 5) + 1}))`,
        }));

        const chartConfig = Object.fromEntries(
            chartData.map((item, index) => [
                item.asset,
                {
                    label: item.asset,
                    color: `hsl(var(--chart-${(index % 5) + 1}))`,
                },
            ])
        );

        return { totalValue, chartData, chartConfig };
    }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>
            A summary of your current asset allocation and total value.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col gap-4">
            <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                <p className="text-3xl font-bold">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">
                    (estimated in USDT)
                </p>
            </div>
        </div>
         <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[250px]"
        >
          <PieChart>
            <Tooltip
              content={<ChartTooltipContent nameKey="value" hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="asset"
              innerRadius={60}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
