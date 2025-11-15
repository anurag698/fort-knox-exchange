
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, XCircle, LogIn } from "lucide-react";
import { useEffect } from "react";
import { useActionState } from "react";
import { cancelOrder } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/hooks/use-orders";
import type { Order } from "@/lib/types";
import { useUser } from "@/firebase";


function CancelOrderButton({ orderId, userId }: { orderId: string, userId: string }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(cancelOrder, { status: "idle", message: "" });

    useEffect(() => {
        if (state.status === 'success' && state.message) {
            toast({ title: "Success", description: state.message });
        } else if (state.status === 'error' && state.message) {
            toast({ variant: "destructive", title: "Error", description: state.message });
        }
    }, [state, toast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="userId" value={userId} />
            <Button variant="ghost" size="icon" type="submit" aria-label="Cancel order">
                <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
        </form>
    );
}

function OrdersTable({ marketId }: { marketId: string }) {
    const { user } = useUser();
    const { data: orders, isLoading, error } = useOrders(marketId);

     const getStatusBadgeVariant = (status: Order['status']) => {
        switch (status) {
            case 'OPEN':
            case 'PARTIAL':
                return 'secondary';
            case 'EXECUTING':
                return 'default';
            case 'CANCELED':
            case 'FAILED':
                return 'destructive';
            case 'FILLED':
                return 'default'; // Success state, could be green
            default:
                return 'outline';
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Orders</AlertTitle>
                <AlertDescription>
                    {error.message || "There was a problem fetching your open orders. Please try again later."}
                </AlertDescription>
            </Alert>
        );
    }
    
    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>You have no open orders for this market.</p>
            </div>
        );
    }

    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Filled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => {
                    const canCancel = (order.status === 'OPEN' || order.status === 'PARTIAL') && user;
                    return (
                        <TableRow key={order.id}>
                            <TableCell>{order.marketId}</TableCell>
                            <TableCell>
                                <span className={order.side === 'BUY' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{order.side}</span>
                            </TableCell>
                            <TableCell>{order.price?.toFixed(2) ?? 'Market'}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>{order.filledAmount}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {canCancel && <CancelOrderButton orderId={order.id} userId={user.uid} />}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}

export function UserTrades({ marketId }: { marketId: string }) {
    const { user, isUserLoading } = useUser();

    const renderContent = () => {
        // This is the critical guard. If the user's auth status is still loading,
        // or if they are logged out, we do not proceed to call the hook that fetches data.
        if (isUserLoading) {
            return (
                <div className="space-y-2">
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
        return <OrdersTable marketId={marketId} />;
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Open Orders</CardTitle>
        <CardDescription>Your active and partially filled orders for this market.</CardDescription>
      </CardHeader>
      <CardContent>
         {renderContent()}
      </CardContent>
    </Card>
  );
}
