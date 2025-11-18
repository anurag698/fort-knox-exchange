// This component displays the user's open orders and trade history for the current market.
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn } from "lucide-react";
import { useUser } from "@/firebase";
import { OpenOrdersPanel } from "@/components/trade/open-orders-panel";

export function UserTrades({ marketId }: { marketId: string }) {
    const { user, isUserLoading } = useUser();

    const renderContent = () => {
        if (isUserLoading) {
            return <div className="space-y-2 p-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
        }
        if (!user) {
            return <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2"><LogIn className="h-6 w-6" /><p>Please sign in to view your orders.</p></div>;
        }
        return <OpenOrdersPanel marketId={marketId} />;
    }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4"><CardTitle className="text-lg">My Open Orders</CardTitle></CardHeader>
      <CardContent className="px-0 pt-0 flex-grow overflow-hidden">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
