
"use client";

import { useEffect, useState, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@/firebase";
import { requestDeposit } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Asset } from "@/lib/types";
import { Copy, Check, Loader2 } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const depositSchema = z.object({
  assetId: z.string().min(1, "Please select an asset."),
  userId: z.string(),
});

type DepositFormValues = z.infer<typeof depositSchema>;

export function DepositForm({ assets }: { assets: Asset[] }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [state, formAction, isActionPending] = useActionState(requestDeposit, { status: "idle", message: "" });
  
  const [depositAddress, setDepositAddress] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: { assetId: "", userId: user?.uid || "" },
  });

  useEffect(() => {
    if(user){
      form.setValue('userId', user.uid);
    }
  }, [user, form]);

  useEffect(() => {
    if (state.status === 'success' && state.data?.address) {
        toast({ title: "Address Generated", description: state.message });
        setDepositAddress(state.data.address);
    } else if (state.status === 'error') {
        toast({ variant: "destructive", title: "Error", description: state.message });
        setDepositAddress("");
    }
  }, [state, toast]);

  const onCopy = async () => {
    if (!depositAddress) return;
    
    if (!navigator.clipboard) {
        toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: 'Clipboard API is not available in this browser or context (requires HTTPS).',
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
            description: 'Could not copy to clipboard. Please select the text and copy it manually.',
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
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="userId" value={user?.uid || ''} />
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
