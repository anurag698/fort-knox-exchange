
'use client';

import { useActionState, useEffect, useState } from 'react';
import { seedDatabase, updateMarketData } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CodeBlock } from '@/components/ui/code-block';

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
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Update Market Data
    </Button>
  );
}

type EnvStatus = {
  key: string;
  present: boolean;
  description: string;
};

export default function SeedDataPage() {
  const { toast } = useToast();
  const [seedState, seedAction] = useActionState(seedDatabase, { status: 'idle', message: '' });
  const [marketDataState, marketDataAction] = useActionState(updateMarketData, { status: 'idle', message: '' });
  const [envStatus, setEnvStatus] = useState<EnvStatus[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    async function checkEnv() {
      try {
        const response = await fetch('/api/_env_check');
        const data = await response.json();
        const status: EnvStatus[] = [
          { key: 'FIREBASE_SERVICE_ACCOUNT_JSON', present: data.FIREBASE_SERVICE_ACCOUNT_JSON, description: 'Required for all server-side Firebase operations (e.g., seeding, KYC, orders).' },
          { key: 'ETH_XPUB', present: data.ETH_XPUB, description: 'Required to generate unique ETH deposit addresses for users.' },
          { key: 'ETH_NETWORK_RPC', present: data.ETH_NETWORK_RPC, description: 'Required for on-chain operations like market orders.' },
        ];
        setEnvStatus(status);
      } catch (error) {
        console.error("Failed to fetch env status:", error);
      } finally {
        setLoadingStatus(false);
      }
    }
    checkEnv();
  }, []);

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

  const allVarsSet = envStatus.every(s => s.present);

  return (
    <div className="flex flex-col gap-8 items-center py-8">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Server Environment Status</CardTitle>
            <CardDescription>
              This checklist shows the status of required server-side secrets. The internal server error will persist until these are all configured correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStatus ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ul className="space-y-3">
                {envStatus.map(status => (
                  <li key={status.key} className="flex items-start gap-4">
                    <div>
                      {status.present ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-mono font-medium">{status.key}</p>
                      <p className="text-sm text-muted-foreground">{status.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!allVarsSet && !loadingStatus && (
               <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  One or more secrets are missing. Follow the steps below to resolve the internal server error.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

       <div className="w-full max-w-3xl space-y-8">
         <Card>
            <CardHeader>
                <CardTitle>1. Configure Environment Variables</CardTitle>
                <CardDescription>
                    Go to your Firebase Studio **Environment** settings for this project. Add the missing variables from the checklist above.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <h3 className="font-semibold">How to get `FIREBASE_SERVICE_ACCOUNT_JSON`:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Go to your Firebase Console → Project Settings → Service accounts.</li>
                    <li>Click **Generate new private key** and download the JSON file.</li>
                    <li>
                        Convert the entire JSON file into a single line. You can use an online tool or run this command in your terminal where the file was downloaded:
                        <CodeBlock>
                            {`node -e "console.log(JSON.stringify(require('./your-downloaded-file.json')))"`}
                        </CodeBlock>
                    </li>
                    <li>Copy the entire single-line output and paste it as the value for `FIREBASE_SERVICE_ACCOUNT_JSON` in Studio.</li>
                </ol>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>2. Restart the Server</CardTitle>
                <CardDescription>
                   After adding the secrets, you **must** restart the server for the changes to take effect. In Firebase Studio, use the "Stop" and then "Start" buttons for your preview.
                </CardDescription>
            </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Seed Database (Optional)</CardTitle>
            <CardDescription>
              Once your environment is configured, use these actions to populate your database with initial assets, markets, and live statistics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <p className="text-sm font-medium">Seed Database</p>
              <p className="text-xs text-muted-foreground">
                Creates the initial set of supported assets (e.g., BTC, ETH) and trading markets (e.g., BTC-USDT). Run this first.
              </p>
              <form action={seedAction}>
                <SeedButton />
              </form>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Update Market Data</p>
              <p className="text-xs text-muted-foreground">
                  Fetches the latest 24h ticker data from an API and stores it in the `market_data` collection for real-time display.
              </p>
              <form action={marketDataAction}>
                  <UpdateDataButton />
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
