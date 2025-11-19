"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type WalletAsset = {
  asset: string;
  balance: number;
  available: number;
  inOrder: number;
  priceUSDT: number;
};

export default function WalletDrawer() {
  const [open, setOpen] = useState(false);

  // TEMP MOCK DATA (replace with backend/wallet API)
  const assets: WalletAsset[] = [
    { asset: "BTC", balance: 0.52, available: 0.41, inOrder: 0.11, priceUSDT: 63000 },
    { asset: "ETH", balance: 1.42, available: 1.42, inOrder: 0, priceUSDT: 3200 },
    { asset: "USDT", balance: 1200, available: 1150, inOrder: 50, priceUSDT: 1 },
    { asset: "SOL", balance: 18, available: 16, inOrder: 2, priceUSDT: 140 },
  ];

  const totalUSDT = assets.reduce((sum, a) => sum + a.balance * a.priceUSDT, 0);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 shadow"
      >
        Wallet
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[998]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 w-[340px] h-full bg-background border-l border-border z-[999] shadow-2xl transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Wallet Overview</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* Total Balance */}
        <div className="px-4 py-3 border-b border-border space-y-1">
          <div className="text-xs text-muted-foreground">Total Balance</div>
          <div className="text-xl font-bold text-primary">
            {totalUSDT.toLocaleString()} USDT
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 flex gap-3 border-b border-border">
          <button className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90">
            Deposit
          </button>
          <button className="flex-1 py-2 rounded-md bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80">
            Withdraw
          </button>
          <button className="flex-1 py-2 rounded-md border border-input text-xs hover:bg-accent">
            Transfer
          </button>
        </div>

        {/* Assets List */}
        <div className="overflow-y-auto h-[calc(100%-180px)] px-4 py-3 space-y-4">
          {assets.map((a) => (
            <div
              key={a.asset}
              className="p-3 rounded-lg border border-border bg-card shadow-sm hover:bg-muted transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{a.asset}</span>
                <span className="text-muted-foreground text-xs">
                  ${(a.balance * a.priceUSDT).toFixed(2)}
                </span>
              </div>

              <div className="text-xs mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance:</span>
                  <span>{a.balance}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span>{a.available}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">In Order:</span>
                  <span>{a.inOrder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
