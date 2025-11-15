
'use client';

import { MarketsClientPage } from '@/components/markets/markets-client-page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MarketsPage() {
  return (
     <div className="flex flex-col gap-8">
       <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Markets
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Explore real-time market data from the Fort Knox Exchange.
        </p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Trading Pairs</CardTitle>
          <CardDescription>
            All available markets for trading on the exchange.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <MarketsClientPage />
        </CardContent>
      </Card>
    </div>
  );
}
