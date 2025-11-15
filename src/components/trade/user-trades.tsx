
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { cancelOrder } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { Market, Asset, Order } from "@/lib/types";


function CancelOrderButton({ orderId }: { orderId: string }) {
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
            <Button variant="ghost" size="icon" type="submit" aria-label="Cancel order">
                <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
        </form>
    );
}

export function UserTrades({ marketId }: { marketId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();

    const [orders, setOrders] = useState<Order[] | null>(null);
    const [assets, setAssets] = useState<Asset[] | null>(null);
    const [market, setMarket] = useState<Market | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
        if (!firestore || !user) {
            setIsLoading(false);
            return;
        }

        const constraints = [
            where('userId', '==', user.uid),
            where('status', 'in', ['OPEN', 'PARTIAL']),
            orderBy('createdAt', 'desc')
        ];
        if (marketId) {
            constraints.splice(1, 0, where('marketId', '==', marketId));
        }
        const ordersQuery = query(collection(firestore, 'orders'), ...constraints);

        const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
            setOrders(snapshot.docs.map(doc => ({...doc.data() as Order, id: doc.id})));
            if(assets && market) setIsLoading(false);
        }, setError);
        
        const unsubAssets = onSnapshot(collection(firestore, 'assets'), (snapshot) => {
            setAssets(snapshot.docs.map(doc => ({...doc.data() as Asset, id: doc.id})));
            if(orders && market) setIsLoading(false);
        }, setError);

        const unsubMarket = onSnapshot(doc(firestore, 'markets', marketId), (doc) => {
            setMarket(doc.exists() ? {...doc.data() as Market, id: doc.id} : null);
            if(orders && assets) setIsLoading(false);
        }, setError);

        return () => {
            unsubOrders();
            unsubAssets();
            unsubMarket();
        }

    }, [firestore, user, marketId, orders, assets, market]);


    const assetsMap = useMemo(() => {
        if (!assets) return new Map();
        return new Map(assets.map(asset => [asset.id, asset]));
    }, [assets]);


    const renderContent = () => {
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
                        There was a problem fetching your open orders. Please try again later.
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

        const baseAsset = market ? assetsMap.get(market.baseAssetId) : null;
        const quoteAsset = market ? assetsMap.get(market.quoteAssetId) : null;

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
                        return (
                            <TableRow key={order.id}>
                                <TableCell>{baseAsset?.symbol}/{quoteAsset?.symbol}</TableCell>
                                <TableCell>
                                    <span className={order.side === 'BUY' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{order.side}</span>
                                </TableCell>
                                <TableCell>{order.price?.toFixed(2) ?? 'Market'}</TableCell>
                                <TableCell>{order.quantity}</TableCell>
                                <TableCell>{order.filledAmount}</TableCell>
                                <TableCell>
                                    <Badge variant={order.status === 'OPEN' ? 'secondary' : 'default'}>{order.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {order.status === 'OPEN' && <CancelOrderButton orderId={order.id} />}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        )
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
