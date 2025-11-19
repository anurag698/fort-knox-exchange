'use client';

import { useEffect, useMemo, useActionState } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cancelOrder } from '@/app/trade/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, XCircle } from "lucide-react";
import type { Order } from "@/lib/types";

function CancelOrderButton({ orderId, userId }: { orderId: string, userId: string }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(cancelOrder, { status: "idle", message: "" });

    useEffect(() => {
        if (state.status === 'success') {
          toast({ title: "Success", description: state.message });
        } else if (state.status === 'error') {
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

export function OpenOrdersPanel({ marketId }: { marketId: string }) {
  const { user } = useUser();
  const { data: allOrders, isLoading, error } = useOrders(user?.uid, marketId);
  
  const openOrders = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter(o => o.status === 'OPEN' || o.status === 'PARTIAL').sort((a,b) => b.createdAt.toDate() - a.createdAt.toDate());
  }, [allOrders]);
  
  const getStatusBadgeVariant = (status: Order['status']) => {
    return {
        'OPEN': 'secondary',
        'PARTIAL': 'secondary',
        'EXECUTING': 'default',
        'CANCELED': 'destructive',
        'FAILED': 'destructive',
        'FILLED': 'default'
    }[status] || 'outline';
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  if (!openOrders.length) {
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
          <TableHead>Date</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Filled</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {openOrders.map(order => (
          <TableRow key={order.id}>
            <TableCell className="text-xs">{order.createdAt.toDate().toLocaleDateString()}</TableCell>
            <TableCell>
              <span className={order.side === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                {order.side}
              </span>
            </TableCell>
            <TableCell>{order.price?.toFixed(2) ?? 'Market'}</TableCell>
            <TableCell>{order.quantity}</TableCell>
            <TableCell>{order.filledAmount}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(order.status)}>
                {order.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {user && <CancelOrderButton orderId={order.id} userId={user.uid} />}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
