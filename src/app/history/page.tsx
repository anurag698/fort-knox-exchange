"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrderStore } from "@/state/order-management-store";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function HistoryPage() {
    const { trades } = useOrderStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPair, setFilterPair] = useState("all");
    const [filterSide, setFilterSide] = useState("all");

    // Get unique pairs from trades
    const uniquePairs = useMemo(() => {
        const pairs = new Set(trades.map(t => t.pair));
        return Array.from(pairs);
    }, [trades]);

    // Filter trades
    const filteredTrades = useMemo(() => {
        return trades.filter(trade => {
            const matchesSearch =
                trade.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trade.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesPair = filterPair === "all" || trade.pair === filterPair;
            const matchesSide = filterSide === "all" || trade.side.toLowerCase() === filterSide;

            return matchesSearch && matchesPair && matchesSide;
        });
    }, [trades, searchQuery, filterPair, filterSide]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalTrades = filteredTrades.length;
        const totalVolume = filteredTrades.reduce((sum, t) => sum + t.total, 0);
        const buyTrades = filteredTrades.filter(t => t.side.toLowerCase() === 'buy').length;
        const sellTrades = filteredTrades.filter(t => t.side.toLowerCase() === 'sell').length;

        return { totalTrades, totalVolume, buyTrades, sellTrades };
    }, [filteredTrades]);

    // Export to CSV
    const exportToCSV = () => {
        const headers = ["Date", "Pair", "Side", "Type", "Price", "Quantity", "Total", "Status"];
        const rows = filteredTrades.map(trade => [
            new Date(trade.timestamp).toLocaleString(),
            trade.pair,
            trade.side,
            trade.type || "LIMIT",
            trade.price,
            trade.quantity,
            trade.total,
            trade.status || "completed"
        ]);

        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `trade-history-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-background pt-20 pb-12">
            <div className="container mx-auto max-w-7xl p-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Trading History</h1>
                    <p className="text-muted-foreground">View and analyze your past trades.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Trades</CardDescription>
                            <CardTitle className="text-2xl">{stats.totalTrades}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Volume</CardDescription>
                            <CardTitle className="text-2xl">${stats.totalVolume.toFixed(2)}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-500" /> Buy Orders
                            </CardDescription>
                            <CardTitle className="text-2xl text-green-500">{stats.buyTrades}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <TrendingDown className="w-3 h-3 text-red-500" /> Sell Orders
                            </CardDescription>
                            <CardTitle className="text-2xl text-red-500">{stats.sellTrades}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filters & Search */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div>
                                <CardTitle>Trade List</CardTitle>
                                <CardDescription>Filter and export your trading history</CardDescription>
                            </div>
                            <Button onClick={exportToCSV} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters Row */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by pair or trade ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <Select value={filterPair} onValueChange={setFilterPair}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="All Pairs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Pairs</SelectItem>
                                    {uniquePairs.map(pair => (
                                        <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filterSide} onValueChange={setFilterSide}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="All Sides" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sides</SelectItem>
                                    <SelectItem value="buy">Buy</SelectItem>
                                    <SelectItem value="sell">Sell</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Pair</TableHead>
                                        <TableHead>Side</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTrades.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                No trades found. Start trading to see your history!
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTrades.map((trade) => (
                                            <TableRow key={trade.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {new Date(trade.timestamp).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="font-medium">{trade.pair}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={trade.side.toLowerCase() === 'buy' ? 'default' : 'destructive'}
                                                        className={cn(
                                                            trade.side.toLowerCase() === 'buy'
                                                                ? "bg-green-500 hover:bg-green-600"
                                                                : "bg-red-500 hover:bg-red-600"
                                                        )}
                                                    >
                                                        {trade.side}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {trade.type || "LIMIT"}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    ${trade.price.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {trade.quantity.toFixed(6)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold">
                                                    ${trade.total.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                                        {trade.status || "Completed"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
