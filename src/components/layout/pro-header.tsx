"use client";

import ThemeToggle from "@/components/theme/theme-toggle";
import { Bell, Wallet, Menu, LogIn, LogOut, User, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from 'next/link';
import { useUser } from "@/providers/azure-auth-provider";

export default function ProHeader() {
  const { user, isUserLoading, signOut } = useUser();
  const [openMobile, setOpenMobile] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setShowProfileMenu(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="relative lg:fixed top-0 left-0 right-0 h-16 z-50 
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
          <Link href="/wallet" className="hover:text-primary transition">
            Wallet
          </Link>
          <Link href="/analytics" className="hover:text-primary transition">
            Analytics
          </Link>
          <Link href="/history" className="hover:text-primary transition">
            History
          </Link>
          <Link href="/referrals" className="hover:text-primary transition">
            Referrals
          </Link>
          <Link href="/vip" className="hover:text-primary transition">
            VIP
          </Link>
          <Link href="/news" className="hover:text-primary transition">
            News
          </Link>
          <Link href="/competitions" className="hover:text-primary transition">
            Competitions
          </Link>
          <Link href="/staking" className="hover:text-primary transition">
            Staking
          </Link>
          <Link href="/leaderboard" className="hover:text-primary transition">
            Leaderboard
          </Link>
          <Link href="/copy-trading" className="hover:text-primary transition">
            Copy Trading
          </Link>
        </nav>
      </div>

      {/* RIGHT — ACTIONS */}
      <div className="flex items-center gap-3">
        {/* THEME TOGGLE */}
        <ThemeToggle />

        {!isUserLoading && (
          user ? (
            <>
              {/* NOTIFICATIONS */}
              <button className="p-2 rounded-lg bg-card hover:bg-muted transition">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* WALLET */}
              <Link href="/wallet" className="p-2 rounded-lg bg-card hover:bg-muted transition">
                <Wallet className="w-5 h-5 text-muted-foreground" />
              </Link>

              {/* USER AVATAR WITH DROPDOWN */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-primary/20 transition"
                >
                  {user.email?.[0].toUpperCase()}
                </button>

                {/* DROPDOWN MENU */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">User ID: {user.uid?.slice(0, 8)}...</p>
                    </div>

                    {/* Menu Items */}
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>

                    <Link
                      href="/wallet"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Wallet className="w-4 h-4" />
                      Wallet
                    </Link>

                    <div className="border-t border-border my-2"></div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-muted transition w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-bold transition-colors">
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )
        )}

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
            <Link href="/wallet" className="hover:text-primary">Wallet</Link>
            <Link href="/analytics" className="hover:text-primary">Analytics</Link>
            <Link href="/history" className="hover:text-primary">History</Link>
            <Link href="/leaderboard" className="hover:text-primary">Leaderboard</Link>
            <Link href="/copy-trading" className="hover:text-primary">Copy Trading</Link>
            {user && (
              <>
                <div className="border-t border-border my-2"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-destructive hover:text-destructive/80 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
