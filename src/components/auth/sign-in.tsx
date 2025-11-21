'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/providers/azure-auth-provider';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { signIn as nextAuthSignIn } from 'next-auth/react';

export function SignIn() {
  const { signIn } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('oauth');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');

  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Use NextAuth for Google OAuth
      const result = await nextAuthSignIn('google', {
        callbackUrl: '/trade/BTC-USDT',
        redirect: false
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        toast({
          title: 'Welcome!',
          description: 'Successfully signed in with Google.',
        });
        router.push('/trade/BTC-USDT');
      }
    } catch (error: any) {
      // Check if user cancelled the flow
      if (error?.message?.includes('user_cancelled')) {
        return;
      }

      console.error('Google sign-in error:', error);
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Failed to sign in with Google. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setLoading(true);
    try {
      // For demo purposes, all OAuth providers use the same Azure AD B2C flow
      // In production, you'd implement separate OAuth flows for each provider
      await signIn();
      router.push('/trade/BTC-USDT');
      toast({
        title: 'Welcome!',
        description: `Successfully signed in with ${provider}.`,
      });
    } catch (error: any) {
      // Check if user cancelled the flow (closed popup)
      if (error?.errorCode === 'user_cancelled' || error?.message?.includes('user_cancelled')) {
        // Silently handle cancellation - user intentionally closed the popup
        console.log('User cancelled sign-in');
        return;
      }

      console.error('Sign in error:', error);
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message || 'Failed to sign in. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate email/password authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo, accept any email/password
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.',
      });
      router.push('/trade/BTC-USDT');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Invalid credentials. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate account creation
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: 'Account Created!',
        description: 'Welcome to Fort Knox Exchange.',
      });
      router.push('/trade/BTC-USDT');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Error',
        description: 'Failed to create account. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="oauth">Social Login</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        {/* OAuth Providers */}
        <TabsContent value="oauth" className="space-y-4">
          <div className="space-y-3">
            {/* Google */}
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-12 gap-3 border-2 hover:bg-accent transition-all"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            {/* Microsoft */}
            <Button
              onClick={() => handleOAuthSignIn('Microsoft')}
              variant="outline"
              className="w-full h-12 gap-3 border-2 hover:bg-accent transition-all"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Continue with Microsoft
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or use email
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setActiveTab('email')}
          >
            Sign in with Email
          </Button>
        </TabsContent>

        {/* Email/Password Form */}
        <TabsContent value="email">
          <Tabs value={emailMode} onValueChange={(value) => setEmailMode(value as 'signin' | 'signup')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In Form */}
            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <button type="button" className="text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up Form */}
            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="rounded border-border mt-0.5" required />
                  <label className="text-muted-foreground">
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">
        By signing in, you agree to our{' '}
        <a href="#" className="text-primary hover:underline">Terms of Service</a>
        {' '}and{' '}
        <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
      </p>
    </div>
  );
}