"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, RefreshCw, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletOverviewProps {
    totalBalanceUsd: number;
    totalBalanceBtc: number;
    onDeposit: () => void;
    onWithdraw: () => void;
}

export function WalletOverview({ totalBalanceUsd, totalBalanceBtc, onDeposit, onWithdraw }: WalletOverviewProps) {
    const [showBalance, setShowBalance] = useState(true);

    return (
        <div className="w-full p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/10 shadow-xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

                {/* Balance Section */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                        <span>Estimated Balance</span>
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="hover:text-primary transition-colors focus:outline-none"
                        >
                            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="text-4xl md:text-5xl font-bold font-mono tracking-tight flex items-baseline gap-1">
                            <span className="text-muted-foreground text-2xl md:text-3xl">$</span>
                            {showBalance ? (
                                <span>{totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            ) : (
                                <span className="tracking-widest">•••••••</span>
                            )}
                            <span className="text-sm text-muted-foreground font-sans font-normal ml-2">USD</span>
                        </div>

                        <div className="text-sm text-muted-foreground font-mono flex items-center gap-2">
                            ≈ {showBalance ? totalBalanceBtc.toFixed(8) : "••••••••"} BTC
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button
                        size="lg"
                        className="flex-1 md:flex-none gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105"
                        onClick={onDeposit}
                    >
                        <ArrowDownLeft className="w-4 h-4" />
                        Deposit
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="flex-1 md:flex-none gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all hover:scale-105"
                        onClick={onWithdraw}
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Withdraw
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

            </div>

            {/* PnL Indicator (Simulated) */}
            <div className="mt-6 pt-4 border-t border-primary/10 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                    <ArrowUpRight className="w-3 h-3" />
                    +$1,240.50 (24h)
                </div>
                <div className="text-xs text-muted-foreground">
                    Your portfolio is up <span className="text-green-500 font-bold">4.2%</span> today
                </div>
            </div>
        </div>
    );
}
