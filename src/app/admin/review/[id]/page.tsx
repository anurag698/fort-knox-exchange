
'use client';

import { useAuthGate } from '@/hooks/use-auth-gate';
import { useWithdrawal } from '@/hooks/use-withdrawal';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ReviewWithdrawalPage({ params }: { params: { id: string } }) {
  useAuthGate();
  const { data: withdrawal, isLoading: isWithdrawalLoading, error: withdrawalError } = useWithdrawal(params.id);
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && withdrawal ? doc(firestore, 'users', withdrawal.userId) : null),
    [firestore, withdrawal]
  );
  
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc(userDocRef);

  const isLoading = isWithdrawalLoading || isProfileLoading;
  const error = withdrawalError || profileError;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            Could not fetch the required data. Please check your security rules or network and try again.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!withdrawal) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Withdrawal Not Found</AlertTitle>
                <AlertDescription>
                    The requested withdrawal could not be found. It may have been processed or deleted.
                </AlertDescription>
            </Alert>
        );
    }

    return (
      <div className="space-y-6">
        <div>
            <h3 className="text-lg font-medium">User Details</h3>
            <p className="text-sm text-muted-foreground">User ID: {userProfile?.id ?? '...'}</p>
            <p className="text-sm text-muted-foreground">Email: {userProfile?.email ?? '...'}</p>
            <p className="text-sm text-muted-foreground">KYC Status: <Badge variant={userProfile?.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}>{userProfile?.kycStatus}</Badge></p>
        </div>
        <div>
            <h3 className="text-lg font-medium">Withdrawal Details</h3>
            <p className="text-sm text-muted-foreground">Amount: {withdrawal.amount}</p>
            <p className="text-sm text-muted-foreground">Asset ID: {withdrawal.assetId}</p>
            <p className="text-sm text-muted-foreground">Status: <Badge variant={withdrawal.status === 'PENDING' ? 'secondary' : 'default'}>{withdrawal.status}</Badge></p>
            <p className="text-sm text-muted-foreground font-mono">Address: {withdrawal.transactionHash || 'N/A'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
            <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Admin</span>
            </Link>
        </Button>
        <div className="flex flex-col gap-1">
            <h1 className="font-headline text-3xl font-bold tracking-tight">
            Review Withdrawal
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
            {params.id}
            </p>
        </div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Request Information</CardTitle>
                <CardDescription>
                    Details of the user and their withdrawal request.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>AI Risk Analysis</CardTitle>
                    <CardDescription>AI-powered assessment of this request.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="h-48 flex items-center justify-center text-muted-foreground text-center">
                       <p>AI analysis will be shown here.</p>
                   </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                   <Button className="w-full">Approve</Button>
                   <Button variant="destructive" className="w-full">Reject</Button>
                </CardFooter>
            </Card>
        </div>
       </div>

    </div>
  );
}
