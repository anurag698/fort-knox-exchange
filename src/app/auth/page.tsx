
'use client';

import { SignIn } from '@/components/auth/sign-in';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AuthPage() {

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to Fort Knox</CardTitle>
          <CardDescription>Sign in or create an account to start trading</CardDescription>
        </CardHeader>
        <CardContent>
          <SignIn />
        </CardContent>
      </Card>
    </div>
  );
}
