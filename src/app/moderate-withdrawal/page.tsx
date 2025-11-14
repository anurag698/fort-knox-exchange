"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { checkWithdrawal } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";

const formSchema = z.object({
  userId: z.string().min(1, "User ID is required.").default("USR-1001"),
  withdrawalId: z.string().min(1, "Withdrawal ID is required.").default(`WID-${Math.floor(1000 + Math.random() * 9000)}`),
  amount: z.coerce.number().positive("Amount must be positive.").default(5.25),
  asset: z.string().min(1, "Asset is required.").default("ETH"),
  withdrawalAddress: z.string().min(1, "Withdrawal address is required.").default("0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"),
  userKYCStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).default('PENDING'),
  userAccountCreationDate: z.string().default('2024-01-15'),
  userWithdrawalHistory: z.string().default("User has made 2 small withdrawals in the past 6 months, both to verified addresses."),
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
      Analyze Request
    </Button>
  );
}

export default function ModerateWithdrawalPage() {
  const { toast } = useToast();
  const [state, formAction] = useFormState(checkWithdrawal, {
    status: "idle",
    message: "",
    result: null,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formSchema.parse({}),
  });

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>AI Withdrawal Moderation</CardTitle>
          <CardDescription>
            Enter withdrawal details to flag suspicious or non-compliant requests using AI.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form action={formAction}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="userId" render={({ field }) => (
                  <FormItem><FormLabel>User ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="withdrawalId" render={({ field }) => (
                  <FormItem><FormLabel>Withdrawal ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="asset" render={({ field }) => (
                  <FormItem><FormLabel>Asset</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="withdrawalAddress" render={({ field }) => (
                <FormItem><FormLabel>Withdrawal Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="userKYCStatus" render={({ field }) => (
                  <FormItem><FormLabel>KYC Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="VERIFIED">Verified</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem></SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="userAccountCreationDate" render={({ field }) => (
                  <FormItem><FormLabel>Account Creation Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="userWithdrawalHistory" render={({ field }) => (
                <FormItem><FormLabel>Withdrawal History Summary</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Analysis Result</CardTitle>
          <CardDescription>The AI's assessment of the request will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          {state.status === "idle" && <p className="text-muted-foreground">Waiting for analysis...</p>}
          {state.status === "success" && state.result && (
            <div className="w-full space-y-4">
              <Alert variant={state.result.isSuspicious ? "destructive" : "default"}>
                {state.result.isSuspicious ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                <AlertTitle>{state.result.isSuspicious ? "Suspicious Request" : "Request Appears Normal"}</AlertTitle>
                <AlertDescription>
                  {state.result.isSuspicious ? state.result.reason : "No immediate compliance flags were raised."}
                </AlertDescription>
              </Alert>
              {state.result.suggestedAction && (
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">Suggested Action</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">{state.result.suggestedAction}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
