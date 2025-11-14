'use client';

import { useAuthGate } from '@/hooks/use-auth-gate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CandlestickChart, ShieldAlert, ArrowRight, AlertCircle, Hourglass } from "lucide-react";
import { useWithdrawals } from '@/hooks/use-withdrawals';
import { useAssets } from '@/hooks/use-assets';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Placeholder data - in a real app, this would be fetched from your backend.
const summaryStats = [
  { title: "Total Users", value: "1,234", icon: Users },
  { title: "Active Markets", value: "5", icon: CandlestickChart },
  { title: "Pending Withdrawals", value: "12", icon: ShieldAlert },
];


export default function AdminPage() {
  useAuthGate();
  const { data: withdrawals, isLoading, error } = useWithdrawals('PENDING');
  const { data: assets, isLoading: assetsLoading } = useAssets();

  const assetsMap = useMemo(() => {
    if (!assets) return new Map();
    return new Map(assets.map(asset => [asset.id, asset]));
  }, [assets]);

  const renderWithdrawals = () => {
    if (isLoading || assetsLoading) {
      return (
        <>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </>
      );
    }

    if (error) {
       return (
        <TableRow>
            <TableCell colSpan={6}>
                 <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Withdrawals</AlertTitle>
                    <AlertDescription>
                        Could not fetch withdrawal data. Please check your Firestore security rules and network connection.
                    </AlertDescription>
                </Alert>
            </TableCell>
        </TableRow>
      );
    }

    if (!withdrawals || withdrawals.length === 0) {
      return (
         <TableRow>
            <TableCell colSpan={6} className="text-center py-12">
                 <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Hourglass className="h-10 w-10 mb-4" />
                    <h3 className="text-lg font-semibold">No Pending Withdrawals</h3>
                    <p className="text-sm">There are no withdrawal requests awaiting moderation.</p>
                </div>
            </TableCell>
        </TableRow>
      );
    }

    return withdrawals.map((withdrawal) => {
        const asset = assetsMap.get(withdrawal.assetId);
        const withdrawalDate = withdrawal.createdAt?.toDate ? withdrawal.createdAt.toDate() : new Date();

        return (
            <TableRow key={withdrawal.id}>
                <TableCell className="font-mono text-xs">{withdrawal.id}</TableCell>
                <TableCell className="font-mono text-xs">{withdrawal.userId}</TableCell>
                <TableCell>{withdrawal.amount} {asset?.symbol ?? '...'}</TableCell>
                <TableCell>
                    {/* AI Risk assessment will be implemented later */}
                    <Badge variant='secondary'>Unknown</Badge>
                </TableCell>
                <TableCell>{withdrawalDate.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                    Review <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                </TableCell>
            </TableRow>
        )
    });

  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Oversee and manage the Fort Knox Exchange.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Moderation Queue</CardTitle>
          <CardDescription>
            Review withdrawal requests flagged by the AI for manual approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderWithdrawals()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
