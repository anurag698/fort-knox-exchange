
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User
} from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});

export function SignIn() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const handleSignUpSuccess = async (user: User) => {
    if (!firestore) return;
    try {
        // This is a new user, create their profile and initial balances
        const batch = writeBatch(firestore);
        const userRef = doc(firestore, 'users', user.uid);
        const newUser = {
            id: user.uid,
            email: user.email,
            username: user.email?.split('@')[0] ?? `user_${Math.random().toString(36).substring(2, 8)}`,
            kycStatus: 'NOT_STARTED',
            role: user.email === 'admin@fortknox.exchange' ? 'ADMIN' : 'USER',
            referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        batch.set(userRef, newUser);

        const balancesRef = doc(firestore, 'users', user.uid, 'balances', 'USDT');
        batch.set(balancesRef, { id: 'USDT', userId: user.uid, assetId: 'USDT', available: 100000, locked: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        const btcBalRef = doc(firestore, 'users', user.uid, 'balances', 'BTC');
        batch.set(btcBalRef, { id: 'BTC', userId: user.uid, assetId: 'BTC', available: 1, locked: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        const ethBalRef = doc(firestore, 'users', user.uid, 'balances', 'ETH');
        batch.set(ethBalRef, { id: 'ETH', userId: user.uid, assetId: 'ETH', available: 10, locked: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        const dogeBalRef = doc(firestore, 'users', user.uid, 'balances', 'DOGE');
        batch.set(dogeBalRef, { id: 'DOGE', userId: user.uid, assetId: 'DOGE', available: 50000, locked: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        const maticBalRef = doc(firestore, 'users', user.uid, 'balances', 'MATIC');
        batch.set(maticBalRef, { id: 'MATIC', userId: user.uid, assetId: 'MATIC', available: 2000, locked: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

        await batch.commit();

    } catch (error: any) {
        console.error("Error creating user profile:", error);
        toast({
            variant: 'destructive',
            title: 'Setup Failed',
            description: 'Could not create your user profile. Please try again.',
        });
        // Optionally sign the user out again if profile creation is critical
        auth?.signOut();
        setLoading(false);
        return; // Stop execution
    }
    
    // If we get here, everything was successful
    router.push('/trade/BTC-USDT');
  }

  const handleAuthError = (error: any) => {
    let message = 'An unknown error occurred.';
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password. Please try again.';
          break;
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists.';
          break;
        case 'auth/invalid-email':
          message = 'The email address is not valid.';
          break;
        default:
          message = error.message;
      }
    }
    toast({
      variant: 'destructive',
      title: 'Authentication Error',
      description: message,
    });
    setLoading(false);
  };


  const onSignInSubmit = async (values: z.infer<typeof signInSchema>) => {
    setLoading(true);
    if (!auth) {
        setLoading(false);
        toast({variant: 'destructive', title: 'Error', description: 'Firebase not initialized.'});
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // The onAuthStateChanged listener in the provider will handle the redirect
      router.push('/trade/BTC-USDT');
    } catch (error) {
      handleAuthError(error);
    }
  };

  const onSignUpSubmit = async (values: z.infer<typeof signUpSchema>) => {
    setLoading(true);
    if (!auth) {
        setLoading(false);
        toast({variant: 'destructive', title: 'Error', description: 'Firebase not initialized.'});
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await handleSignUpSuccess(userCredential.user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <Form {...signInForm}>
          <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-4 mt-4">
            <FormField
              control={signInForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@fortknox.exchange" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={signInForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="signup">
        <Form {...signUpForm}>
          <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4 mt-4">
            <FormField
              control={signUpForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@fortknox.exchange" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={signUpForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={signUpForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
