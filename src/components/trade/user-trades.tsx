
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn } from "lucide-react";
import { useUser } from "@/firebase";
import { OrdersTable } from "@/components/trade/orders-table";

export function UserTrades({ marketId }: { marketId: string }) {
    const { user, isUserLoading } = useUser();

    const renderContent = () => {
        if (isUserLoading) {
            return (
                <div className="space-y-2 p-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            );
        }

        if (!user) {
            return (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                    <LogIn className="h-6 w-6" />
                    <p>Please sign in to view your orders.</p>
                </div>
            )
        }
        
        // Only if the user is authenticated do we render the component
        // that actually fetches and displays the orders.
        return <OrdersTable marketId={marketId} userId={user.uid} />;
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Open Orders</CardTitle>
        <CardDescription>Your active and partially filled orders for this market.</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-0">
         {renderContent()}
      </CardContent>
    </Card>
  );
}
