'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { CodeBlock } from '@/components/ui/code-block';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function DebugDepositPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [userAddressDoc, setUserAddressDoc] = useState<any>(null);
  const [internalDoc, setInternalDoc] = useState<any>(null);

  useEffect(() => {
    if (!firestore || !user) return;

    const userAddrRef = doc(firestore, 'users', user.uid, 'deposit_addresses', 'bsc');
    const internalRef = doc(firestore, 'internal', 'bsc');

    const unsubUser = onSnapshot(userAddrRef, (doc) => {
      setUserAddressDoc(doc.exists() ? doc.data() : { status: 'Not found' });
    });
    const unsubInternal = onSnapshot(internalRef, (doc) => {
      setInternalDoc(doc.exists() ? doc.data() : { status: 'Not found' });
    });

    return () => {
      unsubUser();
      unsubInternal();
    };
  }, [firestore, user]);

  const handleTest = async () => {
    if (!user) {
      setApiError('You must be signed in to test this endpoint.');
      return;
    }
    setIsLoading(true);
    setApiResult(null);
    setApiError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/deposit-address', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      setApiResult(data);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Deposit API Test
        </h1>
        <p className="text-muted-foreground">
          A client-side page to test the `/api/deposit-address` endpoint.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Runner</CardTitle>
          <CardDescription>Click the button to request a new deposit address for the authenticated user.</CardDescription>
        </CardHeader>
        <CardContent>
          {isUserLoading ? (
            <p>Authenticating user...</p>
          ) : user ? (
            <div className="space-y-4">
               <p className="text-sm">Signed in as: <code className="font-mono bg-muted p-1 rounded">{user.uid}</code></p>
                <Button onClick={handleTest} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test GET /api/deposit-address
                </Button>
            </div>
          ) : (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not Signed In</AlertTitle>
                <AlertDescription>
                    Please sign in to test the API. The test requires an authenticated user.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <div>
            <h3 className="font-semibold mb-2">API Response</h3>
            <CodeBlock className="min-h-[100px]">
                {apiError ? `Error: ${apiError}` : JSON.stringify(apiResult, null, 2) || '// Click button to see response'}
            </CodeBlock>
        </div>
         <div>
            <h3 className="font-semibold mb-2">Firestore: `users/{'{uid}'}/deposit_addresses/bsc`</h3>
            <CodeBlock className="min-h-[100px]">
                {JSON.stringify(userAddressDoc, null, 2) || '// Waiting for data...'}
            </CodeBlock>
        </div>
         <div>
            <h3 className="font-semibold mb-2">Firestore: `internal/bsc`</h3>
            <CodeBlock className="min-h-[100px]">
                {JSON.stringify(internalDoc, null, 2) || '// Waiting for data...'}
            </CodeBlock>
        </div>
      </div>
    </div>
  );
}
