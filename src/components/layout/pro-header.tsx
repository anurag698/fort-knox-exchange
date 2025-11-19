"use client";

import ThemeToggle from "@/components/theme/theme-toggle";
import { Bell, Wallet, Menu } from "lucide-react";
import { useState } from "react";
import Link from 'next/link';

export default function ProHeader() {
  const [openMobile, setOpenMobile] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 
      flex items-center justify-between px-4
      bg-card border-b border-border shadow-sm">

      {/* LEFT — LOGO + NAV */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-xl font-semibold text-primary font-sora">
          Fort Knox
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 ml-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <Link href="/trade/BTC-USDT" className="hover:text-primary transition">
            Trade
          </Link>
          <Link href="/markets" className="hover:text-primary transition">
            Markets
          </Link>
          <Link href="/portfolio" className="hover:text-primary transition">
            Wallet
          </Link>
        </nav>
      </div>

      {/* RIGHT — ACTIONS */}
      <div className="flex items-center gap-3">

        {/* NOTIFICATIONS */}
        <button
          className="p-2 rounded-lg bg-card hover:bg-muted transition"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* WALLET */}
        <button
          className="p-2 rounded-lg bg-card hover:bg-muted transition"
        >
          <Wallet className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* THEME TOGGLE */}
        <ThemeToggle />

        {/* MOBILE MENU */}
        <button
          onClick={() => setOpenMobile(!openMobile)}
          className="md:hidden p-2 ml-2 bg-card hover:bg-muted rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="absolute top-16 left-0 right-0 bg-card border-b border-border shadow-md md:hidden">
          <div className="flex flex-col p-4 gap-3 text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <Link href="/trade/BTC-USDT" className="hover:text-primary">Trade</Link>
            <Link href="/markets" className="hover:text-primary">Markets</Link>
            <Link href="/portfolio" className="hover:text-primary">Wallet</Link>
          </div>
        </div>
      )}
    </header>
  );
}
