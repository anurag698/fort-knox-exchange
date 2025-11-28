"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Settings,
    Activity,
    ShieldAlert,
    LogOut,
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        {
            name: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
        },
        {
            name: "Users",
            href: "/admin/users",
            icon: Users,
        },
        {
            name: "Token Listing",
            href: "/admin/tokens",
            icon: Settings,
        },
        {
            name: "Referrals",
            href: "/admin/referrals",
            icon: Users,
        },
        {
            name: "VIP Tiers",
            href: "/admin/vip",
            icon: Activity,
        },
        {
            name: "News",
            href: "/admin/news",
            icon: ShieldAlert,
        },
        {
            name: "Competitions",
            href: "/admin/competitions",
            icon: Activity,
        },
        {
            name: "System Health",
            href: "/admin/health",
            icon: Activity,
        },
        {
            name: "Security Logs",
            href: "/admin/security",
            icon: ShieldAlert,
        },
        {
            name: "Settings",
            href: "/admin/settings",
            icon: Settings,
        },
    ];

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                    !isSidebarOpen && "-translate-x-full md:hidden"
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center h-16 px-6 border-b border-border">
                        <span className="text-lg font-bold text-primary">Fort Knox Admin</span>
                    </div>

                    <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="p-4 border-t border-border">
                        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
                            <LogOut className="w-4 h-4 mr-2" />
                            Exit Admin
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center h-16 px-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden mr-4"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">
                        {navItems.find((item) => item.href === pathname)?.name || "Admin"}
                    </h1>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
