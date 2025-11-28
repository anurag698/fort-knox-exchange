
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Loader2, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { approveKyc, rejectKyc } from '@/app/admin/actions';
import { useFormStatus } from 'react-dom';
import { useUserById } from "@/hooks/use-user-by-id";
import { UserDeposits } from "@/components/wallet/user-deposits";
import { UserWithdrawals } from "@/components/wallet/user-withdrawals";

function KycButtons({ disabled, userId }: { disabled: boolean, userId?: string }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex gap-2 w-full">
      <form action={approveKyc} className="w-full">
        <input type="hidden" name="userId" value={userId} />
        <Button
          className="w-full"
          disabled={disabled || pending}
          type="submit"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Approve KYC
        </Button>
      </form>
      <form action={rejectKyc} className="w-full">
        <input type="hidden" name="userId" value={userId} />
        <Button
          variant="destructive"
          className="w-full"
          disabled={disabled || pending}
          type="submit"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Reject KYC
        </Button>
      </form>
    </div>
  );
}


function ManageUserClient({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUserById(userId);

  const getKYCBadgeVariant = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

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
          <AlertTitle>Error Loading User</AlertTitle>
          <AlertDescription>
            {error.message || "Could not fetch user data. Please check your security rules or network and try again."}
          </AlertDescription>
        </Alert>
      );
    }

    if (!user) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>User Not Found</AlertTitle>
          <AlertDescription>
            The requested user could not be found.
          </AlertDescription>
        </Alert>
      );
    }

    const registrationDate = user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A';

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Account Information</h3>
          <p className="text-sm text-muted-foreground">Username: {user.username}</p>
          <p className="text-sm text-muted-foreground">Email: {user.email}</p>
          <p className="text-sm text-muted-foreground">Registered on: {registrationDate}</p>
        </div>
        <div>
          <h3 className="text-lg font-medium">KYC Status</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Current Status:
            <Badge variant={getKYCBadgeVariant(user.kycStatus)}>{user.kycStatus}</Badge>
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Referral Information</h3>
          <p className="text-sm text-muted-foreground font-mono">Referral Code: {user.referralCode || 'N/A'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Users</span>
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Manage User
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {userId}
          </p>
        </div>
      </div>


      <form>
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              Review user information and manage their KYC status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t pt-6">
            <KycButtons disabled={!user || user.kycStatus !== 'PENDING'} userId={user?.id} />
          </CardFooter>
        </Card>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UserDeposits userId={userId} />
        <UserWithdrawals userId={userId} />
      </div>
    </div>
  );
}

export default async function ManageUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ManageUserClient userId={id} />;
}
