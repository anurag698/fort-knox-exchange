
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, History } from "lucide-react";
import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser } from "@/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import type { Deposit, Asset } from "@/lib/types";

interface UserDepositsProps {
  userId?: string;
}

export function UserDeposits({ userId }: UserDepositsProps) {
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    
    const [deposits, setDeposits] = useState<Deposit[] | null>(null);
    const [assets, setAssets] = useState<Asset[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const targetUserId = userId || authUser?.uid;

    useEffect(() => {
        if (!firestore || !targetUserId) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
          setIsLoading(true);
          setError(null);
          try {
            const [depositsSnap, assetsSnap] = await Promise.all([
              getDocs(query(collection(firestore, 'users', targetUserId, 'deposits'), orderBy('createdAt', 'desc'))),
              getDocs(query(collection(firestore, 'assets')))
            ]);

            setDeposits(depositsSnap.docs.map(doc => ({ ...doc.data() as Deposit, id: doc.id })));
            setAssets(assetsSnap.docs.map(doc => ({...doc.data() as Asset, id: doc.id})));
            
          } catch (err) {
            setError(err as Error);
          } finally {
            setIsLoading(false);
          }
        };

        fetchData();
        
    }, [firestore, targetUserId]);


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
                    <AlertTitle>Error Loading Deposits</AlertTitle>
                    <AlertDescription>
                        There was a problem fetching the deposit history.
                    </AlertDescription>
                </Alert>
            );
        }

        if (!deposits || deposits.length === 0) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No deposit history found.</p>
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
                        <TableHead className="text-right">Tx Hash</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deposits.map(deposit => {
                        const asset = assetsMap.get(deposit.assetId);
                        const depositDate = deposit.createdAt?.toDate ? deposit.createdAt.toDate() : new Date();

                        return (
                            <TableRow key={deposit.id}>
                                <TableCell>{depositDate.toLocaleDateString()}</TableCell>
                                <TableCell>{asset?.symbol ?? 'N/A'}</TableCell>
                                <TableCell>{deposit.amount}</TableCell>
                                <TableCell><Badge variant="secondary">{deposit.status}</Badge></TableCell>
                                <TableCell className="text-right font-mono text-xs">{deposit.transactionHash ?? 'N/A'}</TableCell>
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
        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Deposit History</CardTitle>
        <CardDescription>A record of past deposit requests.</CardDescription>
      </CardHeader>
      <CardContent>
         {renderContent()}
      </CardContent>
    </Card>
  );
}
