
'use client';

import { useActionState, useEffect } from 'react';
import { updateMarketData } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function UpdateDataButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Update Market Data
    </Button>
  );
}

export default function SeedDataPage() {
  const { toast } = useToast();
  const [marketDataState, marketDataAction] = useActionState(updateMarketData, { status: 'idle', message: '' });

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
          <CardTitle>Update Data</CardTitle>
          <CardDescription>
            Use this action to populate your database with live market statistics. The initial assets and markets are now seeded automatically on first user sign-up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Update Market Data</p>
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

    