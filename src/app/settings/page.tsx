'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function SettingsPage() {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );

  const { data: userProfile, isLoading: isProfileLoading, error } = useDoc(userDocRef);

  const isLoading = isAuthLoading || isProfileLoading;
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

  const getAvatarFallback = () => {
    if (authUser?.email) {
      return authUser.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getKYCBadgeVariant = (status: string) => {
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
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load your profile information. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }

    if (!userProfile) {
      return (
         <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <UserIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No Profile Found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            We couldn't find a profile for your account. It may still be provisioning.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-6">
          <Avatar className="h-24 w-24">
            {authUser?.photoURL ? (
                <AvatarImage src={authUser.photoURL} alt="User avatar" />
            ) : userAvatar ? (
                <AvatarImage src={userAvatar.imageUrl} alt="User avatar" data-ai-hint={userAvatar.imageHint} />
            ) : null}
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{userProfile.username}</h2>
            <p className="text-muted-foreground">{userProfile.email}</p>
          </div>
        </div>

        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <span className="font-medium">KYC Status:</span>
                <Badge variant={getKYCBadgeVariant(userProfile.kycStatus)}>{userProfile.kycStatus}</Badge>
            </div>
             <p className="text-sm text-muted-foreground">
              Account Created: {new Date(userProfile.createdAt?.toDate()).toLocaleDateString()}
            </p>
        </div>

        <div className="pt-4">
             <h3 className="text-lg font-semibold mb-2">Account Management</h3>
             <p className="text-sm text-muted-foreground">
                Further account and security management features (like 2FA and API keys) are coming soon.
             </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
       <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Manage your account and security settings.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            This is your personal information on Fort Knox Exchange.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}