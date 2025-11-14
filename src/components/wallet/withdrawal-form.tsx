
"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@/firebase";
import { requestWithdrawal } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Asset, Balance } from "@/lib/types";

const withdrawalSchema = z.object({
  assetId: z.string().min(1, "Please select an asset."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  withdrawalAddress: z.string().min(10, "Please enter a valid withdrawal address."),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export function WithdrawalForm({ assets, balances }: { assets: Asset[], balances: Balance[] }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [state, formAction] = useFormState(requestWithdrawal, { status: "idle", message: "" });

  const balancesMap = new Map(balances.map(b => [b.assetId, b]));

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { assetId: "", amount: undefined, withdrawalAddress: "" },
  });

  useEffect(() => {
    if (state.status === 'success') {
      toast({ title: "Success", description: state.message });
      form.reset();
    } else if (state.status === 'error') {
      toast({ variant: "destructive", title: "Error", description: state.message });
    }
  }, [state, toast, form]);

  const selectedAssetId = form.watch('assetId');
  const availableBalance = balancesMap.get(selectedAssetId)?.available ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Withdrawal</CardTitle>
        <CardDescription>Submit a request to withdraw your assets.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={formAction} className="space-y-4">
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset to withdraw" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id} disabled={!balancesMap.has(asset.id)}>
                          {asset.name} ({asset.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAssetId && (
                     <p className="text-xs text-muted-foreground pt-1">
                        Available Balance: <span className="font-mono">{availableBalance.toFixed(8)}</span>
                     </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="withdrawalAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter destination address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={!user}>
              {user ? 'Submit Withdrawal Request' : 'Please sign in'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
