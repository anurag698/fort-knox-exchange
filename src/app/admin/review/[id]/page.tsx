
'use client';

import { useAuthGate } from '@/hooks/use-auth-gate';
import { useWithdrawal } from '@/hooks/use-withdrawal';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { checkWithdrawal, approveWithdrawal, rejectWithdrawal } from '@/app/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAssets } from '@/hooks/use-assets';
import { useUserWithdrawals } from '@/hooks/use-user-withdrawals';
import type { Withdrawal } from '@/lib/types';

function AnalyzeButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full" formAction={checkWithdrawal}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
      Analyze Now
    </Button>
  );
}

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
  useAuthGate();
  const { toast } = useToast();
  const { data: withdrawal, isLoading: isWithdrawalLoading, error: withdrawalError } = useWithdrawal(params.id);
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && withdrawal ? doc(firestore, 'users', withdrawal.userId) : null),
    [firestore, withdrawal]
  );
  
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc(userDocRef);
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const asset = assets?.find(a => a.id === withdrawal?.assetId);
  const { data: withdrawalHistory, isLoading: isHistoryLoading } = useUserWithdrawals(withdrawal?.userId);

  const [state, formAction] = useFormState(checkWithdrawal, {
    status: 'idle',
    message: '',
    result: null,
  });

   const withdrawalHistorySummary = useMemo(() => {
    if (isHistoryLoading) return "Loading withdrawal history...";
    if (!withdrawalHistory || withdrawalHistory.length === 0) {
      return "No prior withdrawal history found for this user.";
    }

    const completed = withdrawalHistory.filter(w => w.status === 'COMPLETED' || w.status === 'SENT');
    const pending = withdrawalHistory.filter(w => w.status === 'PENDING');
    const rejected = withdrawalHistory.filter(w => w.status === 'REJECTED');

    let summary = `User has a history of ${withdrawalHistory.length} withdrawal(s).`;
    if (completed.length > 0) {
      const totalAmount = completed.reduce((sum, w) => sum + w.amount, 0);
      summary += ` ${completed.length} completed (approx. total ${totalAmount.toFixed(2)}),`;
    }
    if (pending.length > 1) { // > 1 to exclude the current one
      summary += ` ${pending.length -1 } other pending,`;
    }
     if (rejected.length > 0) {
      summary += ` ${rejected.length} rejected.`;
    }

    return summary.trim().replace(/,$/, '.');
  }, [withdrawalHistory, isHistoryLoading]);

  useEffect(() => {
    if (state.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: state.message,
      });
    }
  }, [state, toast]);


  const isLoading = isWithdrawalLoading || isProfileLoading || assetsLoading || isHistoryLoading;
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
     if (state.status === 'success' && state.result) {
       return (
         <div className="w-full space-y-4">
              <Alert variant={state.result.isSuspicious ? "destructive" : "default"}>
                {state.result.isSuspicious ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                <AlertTitle>{state.result.isSuspicious ? "Suspicious Request" : "Request Appears Normal"}</AlertTitle>
                <AlertDescription>
                  {state.result.isSuspicious ? state.result.reason : "No immediate compliance flags were raised."}
                </AlertDescription>
              </Alert>
              {state.result.suggestedAction && (
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">Suggested Action</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">{state.result.suggestedAction}</p>
                  </CardContent>
                </Card>
              )}
            </div>
       )
     }

     return (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-center">
            <p>Click "Analyze Now" to run AI risk assessment.</p>
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
                        {/* Hidden fields for all actions */}
                        <input type="hidden" name="userId" value={withdrawal?.userId} />
                        <input type="hidden" name="withdrawalId" value={withdrawal?.id} />
                        <input type="hidden" name="amount" value={withdrawal?.amount} />
                        <input type="hidden" name="asset" value={asset?.symbol} />
                        <input type="hidden" name="withdrawalAddress" value={withdrawal?.withdrawalAddress} />
                        <input type="hidden" name="userKYCStatus" value={userProfile?.kycStatus} />
                        <input type="hidden" name="userAccountCreationDate" value={userProfile?.createdAt?.toDate().toISOString().split('T')[0]} />
                        <input type="hidden" name="userWithdrawalHistory" value={withdrawalHistorySummary} />

                        <AnalyzeButton />
                        <ModerationButtons disabled={state.status !== 'success'} />
                    </CardFooter>
                </Card>
            </form>
        </div>
       </div>

    </div>
  );
}
