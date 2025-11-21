
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from '@/providers/azure-auth-provider';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Asset } from "@/lib/types";
import { Copy, Check, Loader2 } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

async function requestDepositAddress(userId: string, assetId: string) {
  const res = await fetch('/api/deposit-address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, assetId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.detail || 'Failed to get address');
  return data;
}

const depositSchema = z.object({
  assetId: z.string().min(1, "Please select an asset."),
});

type DepositFormValues = z.infer<typeof depositSchema>;

export function DepositForm({ assets }: { assets: Asset[] }) {
  const { user } = useUser();
  const { toast } = useToast();

  const [depositAddress, setDepositAddress] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: { assetId: "" },
  });

  const onSubmit = async (values: DepositFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }
    setIsActionPending(true);
    setDepositAddress("");
    try {
      const data = await requestDepositAddress(user.uid, values.assetId);
      setDepositAddress(data.address);
      toast({ title: "Address Generated", description: "Your deposit address has been generated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message || "Failed to generate address." });
    } finally {
      setIsActionPending(false);
    }
  }

  const onCopy = async () => {
    if (!depositAddress) return;

    if (typeof navigator === "undefined") {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Clipboard not available.' });
      return;
    }
    if (!navigator.clipboard || !window.isSecureContext) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Clipboard API is not available in this environment. Please copy manually.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(depositAddress);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy to clipboard.',
      });
    }
  };

  const handleAssetChange = (assetId: string) => {
    form.setValue('assetId', assetId);
    setDepositAddress(""); // Clear address when asset changes
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Deposit</CardTitle>
        <CardDescription>Generate a unique deposit address for your chosen asset.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                  <Select onValueChange={handleAssetChange} defaultValue={field.value} name={field.name} disabled={isActionPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset to deposit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets.map(asset => (
                        <SelectItem key={asset.id} value={asset.symbol}>
                          {asset.name} ({asset.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={!user || isActionPending}>
              {isActionPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : user ? 'Generate Deposit Address' : 'Please sign in'}
            </Button>
          </form>
        </Form>
        {depositAddress && (
          <div className="mt-6 space-y-4 rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">Your Deposit Address:</p>
            <div className="relative">
              <Input readOnly value={depositAddress} className="font-mono pr-10" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
                      onClick={onCopy}
                      type="button"
                      aria-label="Copy address"
                    >
                      {hasCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy address</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">
              Only send funds for the selected asset to this address. Sending any other asset may result in the loss of your deposit.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
