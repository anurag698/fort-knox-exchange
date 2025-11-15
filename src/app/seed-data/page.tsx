
'use client';

import { useActionState, useEffect } from 'react';
import { seedDatabase, updateMarketData } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function SeedButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Seed Database
    </Button>
  );
}

function UpdateDataButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full" variant="secondary">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Update Market Data
    </Button>
  );
}

export default function SeedDataPage() {
  const { toast } = useToast();
  const [seedState, seedAction] = useActionState(seedDatabase, { status: 'idle', message: '' });
  const [marketDataState, marketDataAction] = useActionState(updateMarketData, { status: 'idle', message: '' });

  useEffect(() => {
    if (seedState.status === 'success') {
      toast({ title: 'Success!', description: seedState.message });
    } else if (seedState.status === 'error') {
      toast({ variant: 'destructive', title: 'Error', description: seedState.message });
    }
  }, [seedState, toast]);

  useEffect(() => {
    if (marketDataState.status === 'success') {
      toast({ title: 'Success!', description: marketDataState.message });
    } else if (marketDataState.status === 'error') {
      toast({ variant: 'destructive', title: 'Error', description: marketDataState.message });
    }
  }, [marketDataState, toast]);

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Seed & Update Data</CardTitle>
          <CardDescription>
            Use these actions to populate your database with initial data and refresh live market statistics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Seed Initial Data</p>
            <p className="text-xs text-muted-foreground">
                Populates Firestore with the initial set of public assets and markets. This is necessary for the exchange to function correctly.
            </p>
            <form action={seedAction}>
                <SeedButton />
            </form>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">2. Update Market Data</p>
            <p className="text-xs text-muted-foreground">
                Fetches the latest 24h ticker data from the Binance API and stores it in the `market_data` collection for real-time display.
            </p>
            <form action={marketDataAction}>
                <UpdateDataButton />
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
