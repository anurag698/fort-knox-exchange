"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, ArrowRightLeft, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        {
            name: "Home",
            href: "/",
            icon: Home,
        },
        {
            name: "Markets",
            href: "/markets",
            icon: BarChart2,
        },
        {
            name: "Trade",
            href: "/trade/BTC-USDT", // Default to BTC-USDT
            activePattern: "/trade",
            icon: ArrowRightLeft,
        },
        {
            name: "Wallet",
            href: "/wallet",
            icon: Wallet,
        },
        {
            name: "History",
            href: "/history",
            icon: User,
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-t border-border" />

            <nav className="relative flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = item.activePattern
                        ? pathname?.startsWith(item.activePattern)
                        : pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300",
                                "active:scale-95 touch-manipulation", // Better touch feedback
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {/* Active Background Glow */}
                            {isActive && (
                                <div className="absolute inset-0 bg-primary/5 rounded-xl blur-sm -z-10" />
                            )}

                            <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "scale-110 fill-current/20")} />
                            <span className={cn("text-[10px] font-medium transition-all", isActive ? "font-semibold" : "")}>{item.name}</span>

                            {/* Active Indicator Dot */}
                            {isActive && (
                                <div className="absolute top-0 w-10 h-0.5 bg-primary rounded-b-full shadow-[0_0_10px_rgba(var(--primary),0.6)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
