// This component displays the user's open orders and trade history for the current market.
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, History, ListOrdered } from "lucide-react";
import { useUser } from '@/providers/azure-auth-provider';
import { OpenOrdersPanel } from "@/components/trade/open-orders-panel";
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function UserTrades({ marketId }: { marketId: string }) {
  const { user, isUserLoading } = useUser();
  const [activeTab, setActiveTab] = useState<'OPEN' | 'HISTORY'>('OPEN');

  const renderContent = () => {
    if (isUserLoading) {
      return <div className="space-y-2 p-4"><Skeleton className="h-8 w-full animate-shimmer" /><Skeleton className="h-8 w-full animate-shimmer" /></div>;
    }
    if (!user) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 p-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary/50" />
          </div>
          <p className="text-xs">Sign in to view orders</p>
        </div>
      );
    }

    // For now, we only have OpenOrdersPanel. 
    // In a real app, we'd switch based on activeTab.
    return (
      <div className="h-full overflow-hidden">
        <OpenOrdersPanel marketId={marketId} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* TABS HEADER with Premium Styling */}
      <div className="flex items-center bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm border-b border-primary/20 px-2">
        <button
          onClick={() => setActiveTab('OPEN')}
          className={cn(
            "px-4 py-2.5 text-xs font-semibold border-b-2 transition-all relative group",
            activeTab === 'OPEN'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30"
          )}
        >
          <span className="flex items-center gap-2">
            <ListOrdered className="h-3.5 w-3.5" />
            Open Orders
          </span>
          {activeTab === 'OPEN' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary to-transparent" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={cn(
            "px-4 py-2.5 text-xs font-semibold border-b-2 transition-all relative group",
            activeTab === 'HISTORY'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30"
          )}
        >
          <span className="flex items-center gap-2">
            <History className="h-3.5 w-3.5" />
            Order History
          </span>
          {activeTab === 'HISTORY' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary to-transparent" />
          )}
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
}
