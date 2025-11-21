"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Trophy, Users, Copy } from "lucide-react";
import Link from "next/link";

// Mock data for leaderboard
const topTraders = [
    {
        id: "1",
        rank: 1,
        name: "CryptoKing",
        avatar: "https://github.com/shadcn.png",
        pnl: "+1,245.5%",
        pnlValue: "+$124,500",
        winRate: "85%",
        followers: 1250,
        copiers: 450,
        risk: "Medium",
    },
    {
        id: "2",
        rank: 2,
        name: "SatoshiNakamoto",
        avatar: "",
        pnl: "+890.2%",
        pnlValue: "+$89,020",
        winRate: "78%",
        followers: 980,
        copiers: 320,
        risk: "Low",
    },
    {
        id: "3",
        rank: 3,
        name: "BullRunMaster",
        avatar: "",
        pnl: "+650.8%",
        pnlValue: "+$65,080",
        winRate: "65%",
        followers: 750,
        copiers: 210,
        risk: "High",
    },
    {
        id: "4",
        rank: 4,
        name: "AltcoinQueen",
        avatar: "",
        pnl: "+420.1%",
        pnlValue: "+$42,010",
        winRate: "72%",
        followers: 540,
        copiers: 150,
        risk: "Medium",
    },
    {
        id: "5",
        rank: 5,
        name: "HODLer",
        avatar: "",
        pnl: "+310.5%",
        pnlValue: "+$31,050",
        winRate: "60%",
        followers: 420,
        copiers: 90,
        risk: "Low",
    },
];

export default function LeaderboardPage() {
    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
                    <p className="text-muted-foreground">Top performing traders on Fort Knox Exchange.</p>
                </div>
                <Button asChild>
                    <Link href="/copy-trading">Explore Copy Trading</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">CryptoKing</div>
                        <p className="text-xs text-muted-foreground">+1,245.5% PnL (All Time)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Most Copied</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">CryptoKing</div>
                        <p className="text-xs text-muted-foreground">450 Active Copiers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Highest Win Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">CryptoKing</div>
                        <p className="text-xs text-muted-foreground">85% Win Rate</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Rankings</CardTitle>
                    <CardDescription>
                        Ranked by realized PnL over the last 30 days.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Rank</TableHead>
                                <TableHead>Trader</TableHead>
                                <TableHead>PnL %</TableHead>
                                <TableHead>PnL ($)</TableHead>
                                <TableHead>Win Rate</TableHead>
                                <TableHead>Copiers</TableHead>
                                <TableHead>Risk</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topTraders.map((trader) => (
                                <TableRow key={trader.id}>
                                    <TableCell className="font-medium">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${trader.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                                                trader.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                                                    trader.rank === 3 ? "bg-orange-500/20 text-orange-500" :
                                                        "bg-muted text-muted-foreground"
                                            }`}>
                                            {trader.rank}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={trader.avatar} alt={trader.name} />
                                                <AvatarFallback>{trader.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{trader.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-green-500 font-medium">{trader.pnl}</TableCell>
                                    <TableCell>{trader.pnlValue}</TableCell>
                                    <TableCell>{trader.winRate}</TableCell>
                                    <TableCell>{trader.copiers}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            trader.risk === "Low" ? "secondary" :
                                                trader.risk === "Medium" ? "default" : "destructive"
                                        } className={
                                            trader.risk === "Low" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" :
                                                trader.risk === "Medium" ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" :
                                                    "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                        }>
                                            {trader.risk}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="outline">
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
