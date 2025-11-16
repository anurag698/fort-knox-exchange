
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, ShieldAlert, ShieldCheck, Loader2, History, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { approveWithdrawal, rejectWithdrawal } from '@/app/actions';
import { useFormStatus } from 'react-dom';
import type { Asset } from '@/lib/types';
import { UserDeposits } from '@/components/wallet/user-deposits';
import { UserWithdrawals } from '@/components/wallet/user-withdrawals';
import { useUserById } from "@/hooks/use-user-by-id";
import { useWithdrawal } from "@/hooks/use-withdrawal";
import { useAssets } from "@/hooks/use-assets";

function ModerationButtons({ disabled, withdrawalId }: { disabled: boolean, withdrawalId?: string }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex gap-2 w-full">
       <form action={approveWithdrawal} className="w-full">
         <input type="hidden" name="withdrawalId" value={withdrawalId} />
        <Button 
          className="w-full" 
          disabled={disabled || pending} 
          type="submit"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Approve
        </Button>
      </form>
      <form action={rejectWithdrawal} className="w-full">
        <input type="hidden" name="withdrawalId" value={withdrawalId} />
        <Button 
          variant="destructive" 
          className="w-full" 
          disabled={disabled || pending}
          type="submit"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Reject
        </Button>
      </form>
    </div>
  );
}

export default function ReviewWithdrawalPage({ params }: { params: { id: string } }) {
  const { data: withdrawal, isLoading: withdrawalLoading, error: withdrawalError } = useWithdrawal(params.id);
  const { data: userProfile, isLoading: userLoading, error: userError } = useUserById(withdrawal?.userId);
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  
  const isLoading = withdrawalLoading || userLoading || assetsLoading;
  const error = withdrawalError || userError || assetsError;

  const asset = assets?.find(a => a.id === withdrawal?.assetId);

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
            {error.message || "Could not fetch the required data. Please check your security rules or network and try again."}
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
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-medium">User Details</h3>
                    <p className="text-sm text-muted-foreground">User ID: {userProfile?.id ?? '...'}</p>
                    <p className="text-sm text-muted-foreground">Email: {userProfile?.email ?? '...'}</p>
                </div>
                {userProfile && (
                     <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/users/${userProfile.id}`}>
                            <User className="mr-2 h-4 w-4" />
                            Manage User
                        </Link>
                    </Button>
                )}
            </div>
             <p className="text-sm text-muted-foreground mt-2">KYC Status: <Badge variant={userProfile?.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}>{userProfile?.kycStatus}</Badge></p>
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
    <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
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
            <form>
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>AI Risk Analysis</CardTitle>
                        <CardDescription>AI-powered assessment of this request.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    {renderAnalysis()}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <ModerationButtons disabled={!withdrawal || withdrawal.status !== 'PENDING' } withdrawalId={withdrawal?.id} />
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
