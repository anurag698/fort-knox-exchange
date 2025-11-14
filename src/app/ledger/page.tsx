
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthGate } from "@/hooks/use-auth-gate";

export default function LedgerPage() {
  useAuthGate();

  return (
    <div className="flex flex-col gap-8">
       <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Ledger
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          A complete history of all your account transactions.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your deposits, withdrawals, and trade activities are recorded here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Ledger Table will go here */}
          <div className="text-center py-12 text-muted-foreground">
            <p>Ledger functionality coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
