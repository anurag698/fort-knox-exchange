
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BookOpen } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import type { LedgerEntry } from "@/lib/types";

export default function LedgerPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !user?.uid) {
      setIsLoading(false);
      return;
    }
    
    const fetchLedger = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ledgerQuery = query(collection(firestore, 'users', user.uid, 'ledgerEntries'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(ledgerQuery);
        setLedgerEntries(snapshot.docs.map(doc => ({...doc.data() as LedgerEntry, id: doc.id})));
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLedger();
  }, [firestore, user?.uid]);


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load ledger history. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }

    if (!ledgerEntries || ledgerEntries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No Transactions Found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Your transaction history will appear here once you start trading or make a deposit.
          </p>
        </div>
      );
    }

    return <LedgerTable entries={ledgerEntries} />;
  }


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
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
