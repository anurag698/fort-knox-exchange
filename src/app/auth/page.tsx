
'use client';

import { SignIn } from '@/components/auth/sign-in';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AuthPage() {

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] p-4">
      <Card className="w-full max-w-md glass border-primary/10">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Welcome to Fort Knox</CardTitle>
          <CardDescription>Choose your preferred sign-in method</CardDescription>
        </CardHeader>
        <CardContent>
          <SignIn />
        </CardContent>
      </Card>
    </div>
  );
}
