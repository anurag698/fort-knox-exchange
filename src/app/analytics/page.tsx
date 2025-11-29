"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent, Award } from "lucide-react";
import { useOrderStore } from "@/state/order-management-store";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
    const { trades } = useOrderStore();

    // Calculate performance metrics
    const metrics = useMemo(() => {
        if (trades.length === 0) {
            return {
                totalPnL: 0,
                totalVolume: 0,
                winRate: 0,
                totalTrades: 0,
                avgTradeSize: 0,
                bestTrade: 0,
                worstTrade: 0,
                chartData: []
            };
        }

        let cumulativePnL = 0;
        const chartData: { date: string; pnl: number; trade: string; tradePnL: number }[] = [];
        let wins = 0;
        const tradeSizes: number[] = [];
        let bestTrade = -Infinity;
        let worstTrade = Infinity;

        // Sort trades by timestamp
        const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);

        sortedTrades.forEach((trade, index) => {
            // Simulate P&L (in real app, this would be calculated from entry/exit prices)
            const pnl = trade.side.toLowerCase() === 'buy'
                ? (Math.random() - 0.45) * trade.total * 0.05  // Slight bias toward positive
                : (Math.random() - 0.45) * trade.total * 0.05;

            cumulativePnL += pnl;

            if (pnl > 0) wins++;
            if (pnl > bestTrade) bestTrade = pnl;
            if (pnl < worstTrade) worstTrade = pnl;

            tradeSizes.push(trade.total);

            chartData.push({
                date: new Date(trade.timestamp).toLocaleDateString(),
                pnl: Number(cumulativePnL.toFixed(2)),
                trade: trade.pair,
                tradePnL: Number(pnl.toFixed(2))
            });
        });

        const winRate = (wins / trades.length) * 100;
        const totalVolume = trades.reduce((sum, t) => sum + t.total, 0);
        const avgTradeSize = totalVolume / trades.length;

        return {
            totalPnL: cumulativePnL,
            totalVolume,
            winRate,
            totalTrades: trades.length,
            avgTradeSize,
            bestTrade,
            worstTrade,
            chartData
        };
    }, [trades]);

    const isProfitable = metrics.totalPnL >= 0;

    return (
        <div className="min-h-screen bg-background pt-20 pb-12">
            <div className="container mx-auto max-w-7xl p-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h1>
                    <p className="text-muted-foreground">Track your trading performance and statistics.</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                {isProfitable ? (
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                )}
                                Total P&L
                            </CardDescription>
                            <CardTitle className={cn(
                                "text-3xl",
                                isProfitable ? "text-green-500" : "text-red-500"
                            )}>
                                {isProfitable ? "+" : ""}${metrics.totalPnL.toFixed(2)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Percent className="w-4 h-4" />
                                Win Rate
                            </CardDescription>
                            <CardTitle className="text-3xl">
                                {metrics.winRate.toFixed(1)}%
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                Total Volume
                            </CardDescription>
                            <CardTitle className="text-3xl">
                                ${metrics.totalVolume.toFixed(0)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                Avg Trade Size
                            </CardDescription>
                            <CardTitle className="text-3xl">
                                ${metrics.avgTradeSize.toFixed(0)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Performance Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cumulative P&L Over Time</CardTitle>
                        <CardDescription>Your portfolio performance across all trades</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {metrics.chartData.length === 0 ? (
                            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No trade data yet. Start trading to see your performance!</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart data={metrics.chartData}>
                                    <defs>
                                        <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isProfitable ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={isProfitable ? "#10b981" : "#ef4444"} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        className="text-xs"
                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <YAxis
                                        className="text-xs"
                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="pnl"
                                        stroke={isProfitable ? "#10b981" : "#ef4444"}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorPnl)"
                                        name="Cumulative P&L ($)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Trade Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Summary</CardTitle>
                            <CardDescription>Detailed trading statistics</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Total Trades</span>
                                <span className="font-semibold">{metrics.totalTrades}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Win Rate</span>
                                <span className="font-semibold text-green-500">{metrics.winRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Best Trade</span>
                                <span className="font-semibold text-green-500">
                                    +${Math.abs(metrics.bestTrade).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Worst Trade</span>
                                <span className="font-semibold text-red-500">
                                    -${Math.abs(metrics.worstTrade).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Avg Trade Size</span>
                                <span className="font-semibold">${metrics.avgTradeSize.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Volume</span>
                                <span className="font-semibold">${metrics.totalVolume.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Insights</CardTitle>
                            <CardDescription>Key takeaways from your trading</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {metrics.totalTrades === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Start trading to get personalized insights about your performance!
                                </p>
                            ) : (
                                <>
                                    <div className="flex items-start gap-2">
                                        {isProfitable ? (
                                            <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                        )}
                                        <p className="text-sm">
                                            Your portfolio is currently {isProfitable ? "profitable" : "at a loss"} with a total P&L of{" "}
                                            <span className={cn("font-semibold", isProfitable ? "text-green-500" : "text-red-500")}>
                                                {isProfitable ? "+" : ""}${metrics.totalPnL.toFixed(2)}
                                            </span>.
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Percent className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                        <p className="text-sm">
                                            You have a <span className="font-semibold">{metrics.winRate.toFixed(1)}%</span> win rate across{" "}
                                            <span className="font-semibold">{metrics.totalTrades}</span> trades.
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Award className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                                        <p className="text-sm">
                                            Your best trade earned{" "}
                                            <span className="font-semibold text-green-500">+${Math.abs(metrics.bestTrade).toFixed(2)}</span>,
                                            while your worst trade lost{" "}
                                            <span className="font-semibold text-red-500">-${Math.abs(metrics.worstTrade).toFixed(2)}</span>.
                                        </p>
                                    </div>

                                    {metrics.winRate > 60 && (
                                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                🎉 Great job! You're maintaining a strong win rate above 60%.
                                            </p>
                                        </div>
                                    )}

                                    {metrics.winRate < 40 && metrics.totalTrades > 5 && (
                                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                                                💡 Consider reviewing your strategy - your win rate is below 40%.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
