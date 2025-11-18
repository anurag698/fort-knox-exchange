// This component displays a table of the user's orders, with functionality to cancel them.
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, XCircle } from "lucide-react";
import { useEffect, useMemo, useActionState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/hooks/use-orders";
import type { Order } from "@/lib/types";
import { cancelOrder } from '@/app/actions';

function CancelOrderButton({ orderId, userId }: { orderId: string, userId: string }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(cancelOrder, { status: "idle", message: "" });

    useEffect(() => {
        if (state.status === 'success') toast({ title: "Success", description: state.message });
        else if (state.status === 'error') toast({ variant: "destructive", title: "Error", description: state.message });
    }, [state, toast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="userId" value={userId} />
            <Button variant="ghost" size="icon" type="submit" aria-label="Cancel order"><XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" /></Button>
        </form>
    );
}

export function OrdersTable({ marketId, userId }: { marketId: string, userId: string }) {
    const { data: orders, isLoading, error } = useOrders(userId, marketId);

    const sortedOrders = useMemo(() => {
        if (!orders) return [];
        return [...orders].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    }, [orders]);

    const getStatusBadgeVariant = (status: Order['status']) => ({
        'OPEN': 'secondary', 'PARTIAL': 'secondary', 'EXECUTING': 'default',
        'CANCELED': 'destructive', 'FAILED': 'destructive', 'FILLED': 'default'
    }[status] || 'outline');

    if (isLoading) return <div className="space-y-2 p-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
    if (error) return <Alert variant="destructive" className="m-6"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>;
    if (!sortedOrders.length) return <div className="text-center py-12 text-muted-foreground"><p>You have no open orders for this market.</p></div>;

    return (
         <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Side</TableHead><TableHead>Price</TableHead><TableHead>Amount</TableHead><TableHead>Filled</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
                {sortedOrders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell>{order.createdAt.toDate().toLocaleString()}</TableCell>
                        <TableCell><span className={order.side === 'BUY' ? 'text-green-600' : 'text-red-600'}>{order.side}</span></TableCell>
                        <TableCell>{order.price?.toFixed(2) ?? 'Market'}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{order.filledAmount}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                        <TableCell className="text-right">{(order.status === 'OPEN' || order.status === 'PARTIAL') && <CancelOrderButton orderId={order.id} userId={userId} />}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
