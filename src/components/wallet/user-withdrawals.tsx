
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, History } from "lucide-react";
import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser } from "@/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import type { Withdrawal, Asset } from "@/lib/types";

interface UserWithdrawalsProps {
  userId?: string;
}

export function UserWithdrawals({ userId }: UserWithdrawalsProps) {
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    
    const [withdrawals, setWithdrawals] = useState<Withdrawal[] | null>(null);
    const [assets, setAssets] = useState<Asset[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const targetUserId = userId || authUser?.uid;

    useEffect(() => {
        if (!firestore || !targetUserId) {
            setIsLoading(false);
            return;
        }

        const withdrawalsQuery = query(
            collection(firestore, 'users', targetUserId, 'withdrawals'),
            orderBy('createdAt', 'desc')
        );
        const unsubWithdrawals = onSnapshot(withdrawalsQuery, snapshot => {
            setWithdrawals(snapshot.docs.map(doc => ({ ...doc.data() as Withdrawal, id: doc.id })));
            if (assets) setIsLoading(false);
        }, setError);

        const assetsQuery = query(collection(firestore, 'assets'));
        const unsubAssets = onSnapshot(assetsQuery, snapshot => {
            setAssets(snapshot.docs.map(doc => ({...doc.data() as Asset, id: doc.id})));
            if (withdrawals) setIsLoading(false);
        }, setError);

        return () => {
            unsubWithdrawals();
            unsubAssets();
        }
    }, [firestore, targetUserId, assets, withdrawals]);

    const assetsMap = useMemo(() => new Map(assets?.map(a => [a.id, a])), [assets]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Withdrawals</AlertTitle>
                    <AlertDescription>
                        There was a problem fetching the withdrawal history.
                    </AlertDescription>
                </Alert>
            );
        }

        if (!withdrawals || withdrawals.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No withdrawal history found.</p>
                </div>
            );
        }

        return (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-right">Tx Hash</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {withdrawals.map(withdrawal => {
                        const asset = assetsMap.get(withdrawal.assetId);
                        const withdrawalDate = withdrawal.createdAt?.toDate ? withdrawal.createdAt.toDate() : new Date();
                        return (
                            <TableRow key={withdrawal.id}>
                                <TableCell>{withdrawalDate.toLocaleDateString()}</TableCell>
                                <TableCell>{asset?.symbol ?? 'N/A'}</TableCell>
                                <TableCell>{withdrawal.amount}</TableCell>
                                <TableCell><Badge variant="secondary">{withdrawal.status}</Badge></TableCell>
                                <TableCell className="font-mono text-xs">{withdrawal.withdrawalAddress}</TableCell>
                                <TableCell className="text-right font-mono text-xs">{withdrawal.transactionHash ?? 'N/A'}</TableCell>
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
        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Withdrawal History</CardTitle>
        <CardDescription>A record of past withdrawal requests.</CardDescription>
      </CardHeader>
      <CardContent>
         {renderContent()}
      </CardContent>
    </Card>
  );
}
