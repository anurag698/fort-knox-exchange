
'use client';

import { useActionState, useEffect } from 'react';
import { seedDatabase } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Seed Database
    </Button>
  );
}

export default function SeedDataPage() {
  const { toast } = useToast();
  const [state, formAction] = useActionState(seedDatabase, { status: 'idle', message: '' });

  useEffect(() => {
    if (state.status === 'success') {
      toast({ title: 'Success!', description: state.message });
    } else if (state.status === 'error') {
      toast({ variant: 'destructive', title: 'Error', description: state.message });
    }
  }, [state, toast]);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Seed Firestore Database</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the initial set of public assets and markets. This is necessary for the exchange to function correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
