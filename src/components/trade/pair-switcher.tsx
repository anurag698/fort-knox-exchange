"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

const POPULAR_PAIRS = [
    { symbol: "BTC-USDT", name: "Bitcoin", icon: "₿" },
    { symbol: "ETH-USDT", name: "Ethereum", icon: "Ξ" },
    { symbol: "SOL-USDT", name: "Solana", icon: "◎" },
    { symbol: "BNB-USDT", name: "BNB", icon: "💎" },
    { symbol: "DOGE-USDT", name: "Dogecoin", icon: "Ð" },
];

export function PairSwitcher() {
    const pathname = usePathname();

    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Quick Switch:</span>
            <div className="flex items-center gap-1">
                {POPULAR_PAIRS.map((pair) => {
                    const isActive = pathname?.includes(pair.symbol);
                    return (
                        <Link
                            key={pair.symbol}
                            href={`/trade/${pair.symbol}`}
                            className={cn(
                                "px-3 py-1 rounded-md text-xs font-medium transition-all hover:bg-primary/10",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {pair.icon} {pair.symbol.split('-')[0]}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
