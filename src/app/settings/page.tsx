
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User as UserIcon, Loader2, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { updateUserProfile, submitKyc } from '@/app/actions';
import type { UserProfile } from '@/lib/types';


const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Changes
    </Button>
  );
}

function KycSubmitButton({ disabled } : { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Submit for Verification
    </Button>
  );
}


export default function SettingsPage() {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );

  const { data: userProfile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userDocRef);

  const [profileFormState, profileFormAction] = useFormState(updateUserProfile, { status: "idle", message: "" });
  const [kycFormState, kycFormAction] = useFormState(submitKyc, { status: "idle", message: "" });


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({ username: userProfile.username });
    }
  }, [userProfile, form]);
  
  useEffect(() => {
    if (profileFormState.status === 'success') {
      toast({ title: "Success", description: profileFormState.message });
    } else if (profileFormState.status === 'error') {
      toast({ variant: "destructive", title: "Error", description: profileFormState.message });
    }
  }, [profileFormState, toast]);

  useEffect(() => {
    if (kycFormState.status === 'success') {
      toast({ title: "KYC Submitted", description: kycFormState.message });
    } else if (kycFormState.status === 'error') {
      toast({ variant: "destructive", title: "KYC Error", description: kycFormState.message });
    }
  }, [kycFormState, toast]);

  const isLoading = isAuthLoading || isProfileLoading;
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

  const getAvatarFallback = () => {
    if (userProfile?.username) {
      return userProfile.username.substring(0, 2).toUpperCase();
    }
    if (authUser?.email) {
      return authUser.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

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

  const renderProfileContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            There was an error fetching your profile data. It's possible that your security rules are preventing access. Please check the console for more details.
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
            We couldn't find a profile for your account. It may still be provisioning. Please wait a moment and refresh the page.
          </p>
        </div>
      );
    }

    const creationDate = userProfile.createdAt && userProfile.createdAt.toDate 
      ? userProfile.createdAt.toDate()
      : null;

    return (
      <Form {...form}>
        <form action={profileFormAction}>
          <CardContent className="space-y-8">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                {authUser?.photoURL ? (
                    <AvatarImage src={authUser.photoURL} alt="User avatar" />
                ) : userAvatar ? (
                    <AvatarImage src={userAvatar.imageUrl} alt="User avatar" data-ai-hint={userAvatar.imageHint} />
                ) : null}
                <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{userProfile.username}</h2>
                <p className="text-muted-foreground">{userProfile.email}</p>
                <div className="flex items-center gap-2 pt-1">
                    <span className="font-medium text-sm">Member since:</span>
                    <p className="text-sm text-muted-foreground">
                        {creationDate ? creationDate.toLocaleDateString() : 'N/A'}
                    </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <SubmitButton />
          </CardFooter>
        </form>
      </Form>
    );
  };

  const renderKycContent = () => {
    if(isLoading) {
      return <Skeleton className="h-24 w-full" />;
    }

    if(!userProfile) return null;

    const { kycStatus } = userProfile;

    const kycInfo = {
      VERIFIED: { icon: ShieldCheck, title: "KYC Verified", description: "Your identity has been successfully verified. You have full access to all features.", variant: "default" },
      PENDING: { icon: ShieldAlert, title: "KYC Pending", description: "Your information is under review. This may take 1-3 business days.", variant: "secondary" },
      REJECTED: { icon: ShieldAlert, title: "KYC Rejected", description: "There was an issue with your verification. Please contact support.", variant: "destructive" },
    }[kycStatus] || { icon: Shield, title: "KYC Required", description: "Please submit your information for verification to access all features.", variant: "outline" };

    return (
       <CardContent className="flex flex-col items-center justify-center text-center pt-6">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-${kycInfo.variant}/20 mb-4`}>
          <kycInfo.icon className={`h-8 w-8 text-${kycInfo.variant === 'default' ? 'primary' : kycInfo.variant}`} />
        </div>
        <h3 className="text-xl font-semibold">{kycInfo.title}</h3>
        <p className="text-muted-foreground mt-1">{kycInfo.description}</p>
        <Badge variant={getKYCBadgeVariant(kycStatus)} className="mt-4">{kycStatus}</Badge>
      </CardContent>
    )
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>
                Update your personal information on Fort Knox Exchange.
              </CardDescription>
            </CardHeader>
            {renderProfileContent()}
          </Card>
        </div>
        <div className="lg:col-span-1">
          <form action={kycFormAction}>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>KYC Verification</CardTitle>
                <CardDescription>Verify your identity to unlock full features.</CardDescription>
              </CardHeader>
              <div className="flex-grow">
                {renderKycContent()}
              </div>
              <CardFooter className="border-t">
                  <KycSubmitButton disabled={isLoading || userProfile?.kycStatus !== 'PENDING'} />
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
