"use client";

import { TraderCard } from "@/components/social/trader-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import Link from "next/link";

// Mock data for copy trading
const traders = [
    {
        id: "1",
        name: "CryptoKing",
        avatar: "https://github.com/shadcn.png",
        pnl: "+1,245.5%",
        winRate: "85%",
        copiers: 450,
        risk: "Medium" as const,
        description: "Consistent gains through swing trading BTC and ETH. Strict risk management.",
    },
    {
        id: "2",
        name: "SatoshiNakamoto",
        avatar: "",
        pnl: "+890.2%",
        winRate: "78%",
        copiers: 320,
        risk: "Low" as const,
        description: "Long-term value investing in top 10 altcoins. Low frequency, high conviction.",
    },
    {
        id: "3",
        name: "BullRunMaster",
        avatar: "",
        pnl: "+650.8%",
        winRate: "65%",
        copiers: 210,
        risk: "High" as const,
        description: "Aggressive scalping on high volatility meme coins. High risk, high reward.",
    },
    {
        id: "4",
        name: "AltcoinQueen",
        avatar: "",
        pnl: "+420.1%",
        winRate: "72%",
        copiers: 150,
        risk: "Medium" as const,
        description: "Focus on DeFi and L2 ecosystem tokens. Fundamental analysis driven.",
    },
    {
        id: "5",
        name: "HODLer",
        avatar: "",
        pnl: "+310.5%",
        winRate: "60%",
        copiers: 90,
        risk: "Low" as const,
        description: "Dollar cost averaging into blue chips. Set it and forget it strategy.",
    },
    {
        id: "6",
        name: "TrendSurfer",
        avatar: "",
        pnl: "+215.3%",
        winRate: "68%",
        copiers: 75,
        risk: "Medium" as const,
        description: "Following macro trends and momentum. Technical analysis based entries.",
    },
];

export default function CopyTradingPage() {
    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Copy Trading</h1>
                    <p className="text-muted-foreground">Automatically copy the trades of top performing investors.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/leaderboard">View Leaderboard</Link>
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search traders..."
                        className="pl-8"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {traders.map((trader) => (
                    <TraderCard key={trader.id} trader={trader} />
                ))}
            </div>
        </div>
    );
}
