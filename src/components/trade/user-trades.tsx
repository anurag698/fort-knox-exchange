'use client';

import { useOrders } from "@/hooks/use-orders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, XCircle } from "lucide-react";
import { useAssets } from "@/hooks/use-assets";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { cancelOrder } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { doc, getDoc } from 'firebase/firestore';
import type { Market } from "@/lib/types";


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
    const { data: orders, isLoading, error } = useOrders(marketId);
    const { data: assets, isLoading: assetsLoading } = useAssets();
    const firestore = useFirestore();
    const [market, setMarket] = useState<Market | null>(null);
    const [marketLoading, setMarketLoading] = useState(true);

    const marketDocRef = useMemoFirebase(
      () => (firestore && marketId ? doc(firestore, 'markets', marketId) : null),
      [firestore, marketId]
    );

    useEffect(() => {
        if (!marketDocRef) {
            setMarketLoading(false);
            return;
        };

        setMarketLoading(true);
        getDoc(marketDocRef)
          .then(docSnap => {
            if (docSnap.exists()) {
              setMarket({ ...docSnap.data() as Omit<Market, 'id'>, id: docSnap.id });
            } else {
              setMarket(null);
            }
          })
          .catch(err => {
            console.error(err);
          })
          .finally(() => {
            setMarketLoading(false);
          });
    }, [marketDocRef]);


    const assetsMap = useMemo(() => {
        if (!assets) return new Map();
        return new Map(assets.map(asset => [asset.id, asset]));
    }, [assets]);


    const renderContent = () => {
        if (isLoading || assetsLoading || marketLoading) {
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
