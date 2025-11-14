
'use client';

import { useWithdrawal } from '@/hooks/use-withdrawal';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, ShieldAlert, ShieldCheck, Loader2, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { approveWithdrawal, rejectWithdrawal } from '@/app/actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useAssets } from '@/hooks/use-assets';
import type { Withdrawal } from '@/lib/types';
import { UserDeposits } from '@/components/wallet/user-deposits';
import { UserWithdrawals } from '@/components/wallet/user-withdrawals';


function ModerationButtons({ disabled }: { disabled: boolean }) {
  const { pending: approvePending } = useFormStatus();
  const { pending: rejectPending } = useFormStatus();
  const pending = approvePending || rejectPending;

  return (
    <div className="flex gap-2 w-full">
      <Button className="w-full" disabled={disabled || pending} formAction={approveWithdrawal}>
        {approvePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Approve
      </Button>
      <Button variant="destructive" className="w-full" disabled={disabled || pending} formAction={rejectWithdrawal}>
        {rejectPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Reject
      </Button>
    </div>
  );
}


export default function ReviewWithdrawalPage({ params }: { params: { id: string } }) {
  const { data: withdrawal, isLoading: isWithdrawalLoading, error: withdrawalError } = useWithdrawal(params.id);
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && withdrawal ? doc(firestore, 'users', withdrawal.userId) : null),
    [firestore, withdrawal]
  );
  
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc(userDocRef);
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const asset = assets?.find(a => a.id === withdrawal?.assetId);

  const [_, formAction] = useActionState(approveWithdrawal, { status: 'idle', message: '' });


  const isLoading = isWithdrawalLoading || isProfileLoading || assetsLoading;
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
            <p className="text-sm text-muted-foreground">Amount: {withdrawal.amount} {asset?.symbol}</p>
            <p className="text-sm text-muted-foreground">Asset ID: {withdrawal.assetId}</p>
            <p className="text-sm text-muted-foreground">Status: <Badge variant={withdrawal.status === 'PENDING' ? 'secondary' : 'default'}>{withdrawal.status}</Badge></p>
            <p className="text-sm text-muted-foreground font-mono">Address: {withdrawal.withdrawalAddress || 'N/A'}</p>
        </div>
      </div>
    );
  }

  const renderAnalysis = () => {
    if (isLoading) {
        return (
             <div className="h-48 flex items-center justify-center text-muted-foreground text-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <p>Analyzing...</p>
            </div>
        )
    }

     if (withdrawal?.aiRiskLevel) {
       const isSuspicious = withdrawal.aiRiskLevel !== 'Low';
       return (
         <div className="w-full space-y-4">
              <Alert variant={isSuspicious ? "destructive" : "default"}>
                {isSuspicious ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                <AlertTitle>{isSuspicious ? `${withdrawal.aiRiskLevel} Risk Detected` : "Low Risk"}</AlertTitle>
                <AlertDescription>
                  {withdrawal.aiReason ?? 'No details provided.'}
                </AlertDescription>
              </Alert>
            </div>
       )
     }

     return (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-center">
            <p>AI analysis could not be loaded.</p>
        </div>
     )
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
             <form action={formAction} className="flex flex-col h-full">
                <Card className="flex flex-col flex-grow">
                    <CardHeader>
                        <CardTitle>AI Risk Analysis</CardTitle>
                        <CardDescription>AI-powered assessment of this request.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      {renderAnalysis()}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <input type="hidden" name="withdrawalId" value={withdrawal?.id} />
                        <ModerationButtons disabled={!withdrawal || withdrawal.status !== 'PENDING' } />
                    </CardFooter>
                </Card>
            </form>
        </div>
       </div>
       
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <UserDeposits userId={withdrawal?.userId} />
            <UserWithdrawals userId={withdrawal?.userId} />
        </div>

    </div>
  );
}
